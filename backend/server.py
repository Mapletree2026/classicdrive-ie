from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import csv
import logging
import re
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, date


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Sovereign Automotive API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Category mapping ----------
# Source data uses "JDM" / "Euro Classic". Spec UI uses
# "Performance / JDM" and "Everyday / Euro Classic".
CATEGORY_MAP = {
    "JDM": "Performance / JDM",
    "Euro Classic": "Everyday / Euro Classic",
}
ALLOWED_CATEGORIES = list(CATEGORY_MAP.values())


# ---------- Models ----------
class Car(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    car_name: str
    category: str  # "Performance / JDM" or "Everyday / Euro Classic"
    launch_date: str  # ISO date
    vrt_freedom_date: str  # ISO date
    external_link: Optional[str] = None


class CarPublic(Car):
    time_left_days: int
    is_eligible: bool
    status_label: str
    countdown_display: Optional[str] = None


# ---------- Helpers ----------
def _extract_year(name: str) -> int:
    m = re.match(r"\s*(\d{4})", name)
    return int(m.group(1)) if m else 1990


def _compute_status(vrt_freedom_iso: str) -> dict:
    """Return time_left_days, is_eligible, status_label, countdown_display."""
    freedom = datetime.fromisoformat(vrt_freedom_iso).replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    delta = freedom - now
    days_left = delta.days  # floor for positive, truncates for negative

    if delta.total_seconds() <= 0:
        return {
            "time_left_days": 0,
            "is_eligible": True,
            "status_label": "👑 €200 FLAT VRT ELIGIBLE",
            "countdown_display": None,
        }

    if days_left > 30:
        months = days_left // 30
        rem_days = days_left % 30
        countdown = f"{months} Month{'s' if months != 1 else ''}, {rem_days} Day{'s' if rem_days != 1 else ''} Remaining"
    else:
        # 1..30 days
        d = max(1, days_left)
        countdown = f"{d} Day{'s' if d != 1 else ''} Remaining"

    return {
        "time_left_days": days_left,
        "is_eligible": False,
        "status_label": "⏳ COUNTDOWN ACTIVE",
        "countdown_display": countdown,
    }


def _to_public(doc: dict) -> CarPublic:
    base = Car(**doc)
    status = _compute_status(base.vrt_freedom_date)
    return CarPublic(**base.model_dump(), **status)


# ---------- Seeding ----------
async def seed_vrt_registry():
    """Load cars from cars_data.csv into Mongo if collection is empty."""
    count = await db.vrt_registry.count_documents({})
    if count > 0:
        logger.info(f"VRT_Registry already seeded ({count} cars)")
        return

    csv_path = ROOT_DIR / "cars_data.csv"
    if not csv_path.exists():
        logger.warning("cars_data.csv not found, skipping seed")
        return

    docs = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            car_name = row["Car_Name"].strip()
            raw_cat = row["Category"].strip()
            mapped_cat = CATEGORY_MAP.get(raw_cat, raw_cat)
            year = _extract_year(car_name)
            launch_date = f"{year}-01-01"
            vrt_date = row["VRT_Freedom_Date"].strip()
            doc = Car(
                car_name=car_name,
                category=mapped_cat,
                launch_date=launch_date,
                vrt_freedom_date=vrt_date,
                external_link=None,
            ).model_dump()
            docs.append(doc)

    if docs:
        await db.vrt_registry.insert_many(docs)
        logger.info(f"Seeded {len(docs)} cars into VRT_Registry")


@app.on_event("startup")
async def on_startup():
    await seed_vrt_registry()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ---------- Endpoints ----------
@api_router.get("/")
async def root():
    return {"message": "Sovereign Automotive API", "version": "1.0"}


@api_router.get("/cars", response_model=List[CarPublic])
async def list_cars(
    category: Optional[str] = Query(default=None, description="Filter by category"),
    eligible_only: Optional[bool] = Query(default=None),
):
    query = {}
    if category:
        if category not in ALLOWED_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Invalid category. Allowed: {ALLOWED_CATEGORIES}")
        query["category"] = category

    docs = await db.vrt_registry.find(query, {"_id": 0}).sort("vrt_freedom_date", 1).to_list(1000)
    cars = [_to_public(d) for d in docs]

    if eligible_only is True:
        cars = [c for c in cars if c.is_eligible]
    elif eligible_only is False:
        cars = [c for c in cars if not c.is_eligible]

    return cars


@api_router.get("/cars/categories")
async def get_categories():
    return {"categories": ALLOWED_CATEGORIES}


@api_router.get("/cars/stats")
async def get_stats():
    docs = await db.vrt_registry.find({}, {"_id": 0}).to_list(2000)
    total = len(docs)
    eligible = sum(1 for d in docs if _compute_status(d["vrt_freedom_date"])["is_eligible"])
    return {
        "total": total,
        "eligible": eligible,
        "pending": total - eligible,
        "by_category": {
            cat: sum(1 for d in docs if d.get("category") == cat) for cat in ALLOWED_CATEGORIES
        },
    }


@api_router.get("/cars/{car_id}", response_model=CarPublic)
async def get_car(car_id: str):
    doc = await db.vrt_registry.find_one({"id": car_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Car not found")
    return _to_public(doc)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
