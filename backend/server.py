from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import csv
import logging
import re
import uuid
import secrets
import hashlib
import jwt
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

# ------------------- Mongo -------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ------------------- App -------------------
app = FastAPI(title="RetroDrive.ie API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

JWT_ALGO = "HS256"
JWT_TTL_DAYS = 14
MAGIC_TTL_MIN = 15
SENTIMENTS = ("buy", "hold", "sell")

CATEGORY_MAP = {
    "JDM": "Performance / JDM",
    "Euro Classic": "Everyday / Euro Classic",
}
ALLOWED_CATEGORIES = list(CATEGORY_MAP.values())


# ------------------- Models -------------------
class Car(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    car_name: str
    category: str
    launch_date: str
    vrt_freedom_date: str
    external_link: Optional[str] = None


class SentimentSummary(BaseModel):
    buy: int = 0
    hold: int = 0
    sell: int = 0
    total: int = 0
    buy_pct: float = 0.0
    hold_pct: float = 0.0
    sell_pct: float = 0.0
    user_vote: Optional[str] = None


class CarPublic(Car):
    time_left_days: int
    is_eligible: bool
    status_label: str
    countdown_display: Optional[str] = None
    sentiment: Optional[SentimentSummary] = None


class RequestLinkIn(BaseModel):
    email: EmailStr


class SuggestionIn(BaseModel):
    car_name: str = Field(min_length=2, max_length=120)
    category: Optional[str] = Field(default=None, max_length=40)
    notes: Optional[str] = Field(default=None, max_length=500)
    email: Optional[EmailStr] = None


class VoteIn(BaseModel):
    sentiment: Literal["buy", "hold", "sell"]


# ------------------- Helpers -------------------
def _extract_year(name: str) -> int:
    m = re.match(r"\s*(\d{4})", name)
    return int(m.group(1)) if m else 1990


def _compute_status(vrt_freedom_iso: str) -> dict:
    freedom = datetime.fromisoformat(vrt_freedom_iso).replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    delta = freedom - now
    days_left = delta.days

    if delta.total_seconds() <= 0:
        return {
            "time_left_days": 0,
            "is_eligible": True,
            "status_label": "👑 €200 FLAT VRT ELIGIBLE",
            "countdown_display": None,
        }
    if days_left > 30:
        months = days_left // 30
        rem = days_left % 30
        cd = f"{months} Month{'s' if months != 1 else ''}, {rem} Day{'s' if rem != 1 else ''} Remaining"
    else:
        d = max(1, days_left)
        cd = f"{d} Day{'s' if d != 1 else ''} Remaining"
    return {
        "time_left_days": days_left,
        "is_eligible": False,
        "status_label": "⏳ COUNTDOWN ACTIVE",
        "countdown_display": cd,
    }


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_jwt(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_TTL_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGO)


def _decode_jwt(token: str) -> dict:
    return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGO])


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = _decode_jwt(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def _sentiment_for_car(car_id: str, user: Optional[dict]) -> SentimentSummary:
    pipeline = [
        {"$match": {"car_id": car_id}},
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}},
    ]
    counts = {"buy": 0, "hold": 0, "sell": 0}
    async for row in db.votes.aggregate(pipeline):
        if row["_id"] in counts:
            counts[row["_id"]] = row["count"]
    total = sum(counts.values())
    pct = {k: (round(counts[k] * 100 / total, 1) if total else 0.0) for k in counts}
    user_vote = None
    if user:
        existing = await db.votes.find_one({"car_id": car_id, "user_id": user["id"]}, {"_id": 0, "sentiment": 1})
        user_vote = existing["sentiment"] if existing else None
    return SentimentSummary(
        buy=counts["buy"], hold=counts["hold"], sell=counts["sell"],
        total=total, buy_pct=pct["buy"], hold_pct=pct["hold"], sell_pct=pct["sell"],
        user_vote=user_vote,
    )


def _to_public(doc: dict, sentiment: Optional[SentimentSummary] = None) -> CarPublic:
    base = Car(**doc)
    return CarPublic(**base.model_dump(), **_compute_status(base.vrt_freedom_date), sentiment=sentiment)


# ------------------- Email (mock) -------------------
async def send_magic_link_email(email: str, link: str) -> dict:
    mode = os.environ.get("EMAIL_MODE", "mock").lower()
    if mode == "mock":
        logger.info(f"[MOCK EMAIL] Magic link for {email}: {link}")
        return {"mode": "mock", "magic_link": link}
    # Resend integration seam (not active until key configured)
    return {"mode": mode, "magic_link": None}


# ------------------- Seeding -------------------
async def seed_vrt_registry():
    count = await db.vrt_registry.count_documents({})
    if count > 0:
        logger.info(f"VRT_Registry already seeded ({count} cars)")
        return
    csv_path = ROOT_DIR / "cars_data.csv"
    if not csv_path.exists():
        return
    docs = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            name = row["Car_Name"].strip()
            cat = CATEGORY_MAP.get(row["Category"].strip(), row["Category"].strip())
            docs.append(Car(
                car_name=name,
                category=cat,
                launch_date=f"{_extract_year(name)}-01-01",
                vrt_freedom_date=row["VRT_Freedom_Date"].strip(),
                external_link=None,
            ).model_dump())
    if docs:
        await db.vrt_registry.insert_many(docs)
        logger.info(f"Seeded {len(docs)} cars")


async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.magic_links.create_index("expires_at", expireAfterSeconds=0)
    await db.votes.create_index([("car_id", 1), ("user_id", 1)], unique=True)
    await db.votes.create_index("car_id")


@app.on_event("startup")
async def on_startup():
    await ensure_indexes()
    await seed_vrt_registry()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ------------------- Endpoints: root + cars -------------------
@api_router.get("/")
async def root():
    return {"message": "RetroDrive.ie API", "version": "1.2"}


@api_router.get("/cars", response_model=List[CarPublic])
async def list_cars(category: Optional[str] = Query(default=None)):
    q = {}
    if category:
        if category not in ALLOWED_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Invalid category. Allowed: {ALLOWED_CATEGORIES}")
        q["category"] = category
    docs = await db.vrt_registry.find(q, {"_id": 0}).sort("vrt_freedom_date", 1).to_list(2000)
    return [_to_public(d) for d in docs]


@api_router.get("/cars/categories")
async def get_categories():
    return {"categories": ALLOWED_CATEGORIES}


@api_router.get("/cars/trending")
async def get_trending(limit: int = 8):
    """Top cars by total vote count with sentiment breakdown."""
    pipeline = [
        {"$group": {"_id": "$car_id",
                    "total": {"$sum": 1},
                    "buy": {"$sum": {"$cond": [{"$eq": ["$sentiment", "buy"]}, 1, 0]}},
                    "hold": {"$sum": {"$cond": [{"$eq": ["$sentiment", "hold"]}, 1, 0]}},
                    "sell": {"$sum": {"$cond": [{"$eq": ["$sentiment", "sell"]}, 1, 0]}}}},
        {"$sort": {"total": -1}},
        {"$limit": max(1, min(50, limit))},
    ]
    rows = [r async for r in db.votes.aggregate(pipeline)]
    out = []
    for r in rows:
        car = await db.vrt_registry.find_one({"id": r["_id"]}, {"_id": 0})
        if not car:
            continue
        t = r["total"] or 1
        out.append({
            "car_id": r["_id"],
            "car_name": car["car_name"],
            "category": car["category"],
            "total": r["total"],
            "buy_pct": round(r["buy"] * 100 / t, 1),
            "hold_pct": round(r["hold"] * 100 / t, 1),
            "sell_pct": round(r["sell"] * 100 / t, 1),
        })
    # If fewer than `limit` cars have any votes, pad with random recent cars so the
    # ticker is never empty at launch.
    if len(out) < limit:
        existing = {x["car_id"] for x in out}
        extra = await db.vrt_registry.find({"id": {"$nin": list(existing)}}, {"_id": 0}).limit(limit - len(out)).to_list(limit)
        for car in extra:
            out.append({
                "car_id": car["id"], "car_name": car["car_name"], "category": car["category"],
                "total": 0, "buy_pct": 0.0, "hold_pct": 0.0, "sell_pct": 0.0,
            })
    return out


@api_router.get("/cars/stats")
async def get_stats():
    docs = await db.vrt_registry.find({}, {"_id": 0}).to_list(2000)
    total = len(docs)
    eligible = sum(1 for d in docs if _compute_status(d["vrt_freedom_date"])["is_eligible"])
    return {
        "total": total,
        "eligible": eligible,
        "pending": total - eligible,
        "by_category": {c: sum(1 for d in docs if d.get("category") == c) for c in ALLOWED_CATEGORIES},
    }


@api_router.get("/cars/{car_id}", response_model=CarPublic)
async def get_car(car_id: str, request: Request):
    doc = await db.vrt_registry.find_one({"id": car_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Car not found")
    user = await get_optional_user(request)
    sentiment = await _sentiment_for_car(car_id, user)
    return _to_public(doc, sentiment)


@api_router.get("/cars/{car_id}/sentiment", response_model=SentimentSummary)
async def get_sentiment(car_id: str, request: Request):
    doc = await db.vrt_registry.find_one({"id": car_id}, {"_id": 0, "id": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Car not found")
    user = await get_optional_user(request)
    return await _sentiment_for_car(car_id, user)


@api_router.post("/cars/{car_id}/vote", response_model=SentimentSummary)
async def cast_vote(car_id: str, payload: VoteIn, user: dict = Depends(get_current_user)):
    doc = await db.vrt_registry.find_one({"id": car_id}, {"_id": 0, "id": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Car not found")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.votes.update_one(
        {"car_id": car_id, "user_id": user["id"]},
        {
            "$set": {"sentiment": payload.sentiment, "updated_at": now_iso},
            "$setOnInsert": {"car_id": car_id, "user_id": user["id"], "created_at": now_iso},
        },
        upsert=True,
    )
    return await _sentiment_for_car(car_id, user)


# ------------------- Endpoints: auth (magic link) -------------------
@api_router.post("/auth/request-link")
async def request_link(payload: RequestLinkIn):
    email = payload.email.lower().strip()
    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=MAGIC_TTL_MIN)
    await db.magic_links.insert_one({
        "email": email,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.now(timezone.utc),
    })
    frontend = os.environ.get("FRONTEND_URL", "").rstrip("/")
    link = f"{frontend}/auth/verify?token={raw_token}"
    info = await send_magic_link_email(email, link)
    resp = {"ok": True, "expires_in_minutes": MAGIC_TTL_MIN, "mode": info["mode"]}
    if info["mode"] == "mock":
        resp["magic_link"] = link  # dev convenience only
    return resp


@api_router.get("/auth/verify")
async def verify_link(token: str):
    token_hash = _hash_token(token)
    doc = await db.magic_links.find_one({"token_hash": token_hash})
    if not doc:
        raise HTTPException(status_code=400, detail="Invalid or expired link")
    if doc.get("used"):
        raise HTTPException(status_code=400, detail="Link already used")
    expires_at = doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expired")

    email = doc["email"]
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user.copy())

    await db.magic_links.update_one({"_id": doc["_id"]}, {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}})

    access_token = _create_jwt(user["id"], user["email"])
    return {"access_token": access_token, "user": {"id": user["id"], "email": user["email"]}}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"]}


@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    return {"ok": True}


# ------------------- Endpoints: suggestions -------------------
@api_router.post("/suggestions")
async def submit_suggestion(payload: SuggestionIn):
    doc = {
        "id": str(uuid.uuid4()),
        "car_name": payload.car_name.strip(),
        "category": (payload.category or "").strip() or None,
        "notes": (payload.notes or "").strip() or None,
        "email": payload.email.lower() if payload.email else None,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.suggestions.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api_router.get("/suggestions/count")
async def suggestions_count():
    return {"total": await db.suggestions.count_documents({})}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
