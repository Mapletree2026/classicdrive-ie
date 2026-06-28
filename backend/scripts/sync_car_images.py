"""
One-shot image-URL backfill for /api/cars.

For each car in the registry, derive a Wikipedia article slug from car_name,
hit the free Wikipedia REST summary API, and store originalimage.source as
car.image_url. No credits, no auth, fully deterministic.

Usage:  python /app/backend/scripts/sync_car_images.py
"""
import asyncio
import os
import re
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

WIKI = "https://en.wikipedia.org/api/rest_v1/page/summary/{slug}"
UA = {"User-Agent": "ClassicDriveBot/1.0 (https://classicdrive.ie)"}
CONCURRENCY = 8

# ----- car_name → Wikipedia article candidates -----
# Strip leading year and trailing variant text to converge on "Make Model".
YEAR_RE = re.compile(r"^\d{4}\s+")
PAREN_RE = re.compile(r"\s*\(.*?\)")


def _candidates(car_name: str):
    """Return ordered Wikipedia article slug guesses for a given car_name."""
    nm = PAREN_RE.sub("", YEAR_RE.sub("", car_name)).strip()
    parts = nm.split()
    out = []

    def add(slug):
        s = re.sub(r"\s+", "_", slug.strip())
        if s and s not in out:
            out.append(s)

    # Specific generation hints
    upper = nm.upper()
    gens = re.findall(r"\b(E\d{2,3}|R3[2-5]|F[CD]3?S?|EK\d|DC\d|JZX\d+|S1[45]|MK\s?[IVX0-9]+|990?[0-9]|FD3S|FC3S|99[34]|996|997|991|992|G80|G82|W12[0-4]|W20[12]|W210)\b", upper)
    gen = gens[0].replace(" ", "") if gens else None

    # 2-token make+model + variants
    if len(parts) >= 2:
        make = parts[0]
        m2 = " ".join(parts[:2])
        m3 = " ".join(parts[:3])
        m4 = " ".join(parts[:4])

        if gen:
            add(f"{m2} ({gen})")
            add(f"{m3} ({gen})")
        # Make + first 3 tokens
        add(m3)
        add(m2)
        add(m4)
        # Trailing variant trimmed
        clean = re.sub(r"\s+(GSR|RS|R|R2|S|Type R|Type RS|Spec.*|Edition.*|V-?Spec.*|Touring.*|Tourer.*|Vertex.*|Autech.*|Phase.*|Late.*|Early.*)$", "", m4, flags=re.I).strip()
        if clean and clean != m2:
            add(clean)

    # Make-only as final fallback
    if parts:
        add(parts[0])
    return out


# Manual overrides for known-tricky cases where Wikipedia articles return modern facelifts.
OVERRIDES = {
    # Match by lowercase substring in car_name
    "civic type r ek": "Honda_Civic_Type_R",
    "integra type r": "Honda_Integra_Type_R",
    "lancer evolution iv": "Mitsubishi_Lancer_Evolution",
    "lancer evolution v": "Mitsubishi_Lancer_Evolution",
    "lancer evolution vi": "Mitsubishi_Lancer_Evolution",
    "lancer evolution vii": "Mitsubishi_Lancer_Evolution",
    "lancer evolution viii": "Mitsubishi_Lancer_Evolution",
    "lancer evolution ix": "Mitsubishi_Lancer_Evolution",
    "lancer evolution x": "Mitsubishi_Lancer_Evolution",
    "skyline gt-r r33": "Nissan_Skyline_GT-R",
    "skyline gt-r r34": "Nissan_Skyline_GT-R",
    "skyline gt-r r32": "Nissan_Skyline_GT-R",
    "supra rz": "Toyota_Supra",
    "supra turbo": "Toyota_Supra",
    "rx-7 fd": "Mazda_RX-7",
    "rx-7 type": "Mazda_RX-7",
    "rx-7 spirit": "Mazda_RX-7",
    "silvia": "Nissan_Silvia",
    "chaser tourer": "Toyota_Chaser",
    "aristo": "Toyota_Aristo",
    "altezza": "Toyota_Altezza",
    "stagea 260rs": "Nissan_Stagea",
    "celica gt-four": "Toyota_Celica",
    "mr2 turbo": "Toyota_MR2",
    "subaru impreza 22b": "Subaru_Impreza_22B_STi",
    "impreza wrx sti": "Subaru_Impreza",
    "nsx-r": "Honda_NSX",
    "nsx (na": "Honda_NSX",
    "m3 e30": "BMW_M3_(E30)",
    "m3 e36": "BMW_M3",
    "m5 e39": "BMW_M5",
    "m roadster z3": "BMW_Z3",
    "m coupe z3": "BMW_Z3",
    "porsche 911 993": "Porsche_911_(993)",
    "porsche 911 996": "Porsche_911_(996)",
    "porsche 911 964": "Porsche_911_(964)",
    "porsche boxster": "Porsche_Boxster",
    "mercedes-benz e55 amg": "Mercedes-Benz_E55_AMG",
    "lotus elise series 1": "Lotus_Elise",
    "lotus elise": "Lotus_Elise",
    "alfa romeo 156": "Alfa_Romeo_156",
    "audi s4 b5": "Audi_S4",
    "audi a4 1.8t": "Audi_A4",
    "vw golf gti mk4": "Volkswagen_Golf_Mk4",
    "volkswagen golf gti mk4": "Volkswagen_Golf_Mk4",
    "renault clio williams": "Renault_Clio_Williams",
    "ford escort rs cosworth": "Ford_Escort_RS_Cosworth",
    "ford sierra rs cosworth": "Ford_Sierra_RS_Cosworth",
    "ford sierra cosworth": "Ford_Sierra_RS_Cosworth",
    "civic type r ep3": "Honda_Civic_Type_R",
    "civic type r fd2": "Honda_Civic_Type_R",
    "civic type r fk": "Honda_Civic_Type_R",
    "honda s2000": "Honda_S2000",
    "mazda mx-5": "Mazda_MX-5",
    "ferrari 360": "Ferrari_360",
    "ferrari f355": "Ferrari_F355",
    "ferrari 550": "Ferrari_550_Maranello",
    "lexus is300": "Lexus_IS",
    "lexus lfa": "Lexus_LFA",
    "350z": "Nissan_350Z",
    "350 z": "Nissan_350Z",
    "200sx": "Nissan_200SX",
    "180sx": "Nissan_180SX",
    "300zx": "Nissan_300ZX",
    "lancia delta": "Lancia_Delta_HF_Integrale",
    "alfa romeo gtv": "Alfa_Romeo_GTV",
    "audi quattro": "Audi_Quattro",
    "audi tt": "Audi_TT",
    "bmw z3": "BMW_Z3",
    "mini cooper": "Mini_Cooper_(2001)",
    "mercedes-benz e55 amg": "Mercedes-Benz_E55_AMG",
    "alfa romeo gtv": "Alfa_Romeo_Spider_(916)",
    "porsche boxster 986": "Porsche_Boxster",
    "audi a4 1.8t": "Audi_A4_B5",
    "bmw m5 e60": "BMW_M5",
    "bmw e60 m5": "BMW_M5",
    "bmw e92 m3": "BMW_M3",
    "bmw m3 e92": "BMW_M3",
    "bmw z4": "BMW_Z4",
    "audi r8": "Audi_R8",
    "audi rs6": "Audi_RS_6",
    "audi rs5": "Audi_RS_5",
    "audi rs4": "Audi_RS_4",
    "audi s6": "Audi_S6",
    "lexus is-f": "Lexus_IS_F",
    "lexus is f": "Lexus_IS_F",
    "mazda rx-8": "Mazda_RX-8",
    "subaru legacy": "Subaru_Legacy",
    "subaru impreza 22b": "Subaru_Impreza_22B_STi",
    "ford focus rs": "Ford_Focus_RS",
    "toyota mark x": "Toyota_Mark_X",
    "nissan fairlady z z34": "Nissan_370Z",
    "fairlady z version nismo": "Nissan_370Z",
    "mazda atenza": "Mazda6",
    "mazda speed atenza": "Mazda6",
    "toyota aristo": "Toyota_Aristo",
    "toyota altezza": "Toyota_Altezza",
    "bmw m roadster": "BMW_Z3",
    "bmw m5 e39": "BMW_M5",
    "audi a4 b5": "Audi_A4_B5",
}


def _override_for(car_name: str):
    nm = car_name.lower()
    for needle, slug in OVERRIDES.items():
        if needle in nm:
            return slug
    return None


def _resize_url(url: str, width: int = 1280) -> str:
    """Convert a Wikimedia originalimage URL to a stable thumbnail width."""
    if not url or "upload.wikimedia.org" not in url:
        return url
    # Already a thumb? Replace the size.
    if "/thumb/" in url and re.search(r"/\d+px-", url):
        return re.sub(r"/\d+px-", f"/{width}px-", url)
    # originalimage from REST API is usually already a thumb at full res. Leave it.
    return url


# Direct Wikimedia Commons file overrides for cases where the Wikipedia article
# REST summary returns a modern facelift (e.g. BMW M3 page = G80, not E30).
# These point at known-vintage Commons File: pages and resolve to actual thumb URLs
# via the imageinfo API at runtime.
COMMONS_OVERRIDES = {
    "supra a70":          "File:Toyota Supra (A70, pre-facelift) 1X7A2556.jpg",
    "supra mk3":          "File:Toyota Supra (A70, pre-facelift) 1X7A2556.jpg",
    "supra turbo mk3":    "File:Toyota Supra (A70, pre-facelift) 1X7A2556.jpg",
    "supra rz a80":       "File:1997 Toyota Supra (A80) RZ-S front.jpg",
    "supra mk4":          "File:1997 Toyota Supra (A80) RZ-S front.jpg",
    "supra a80":          "File:1997 Toyota Supra (A80) RZ-S front.jpg",
    "m3 e30":             "File:BMW M3 E30 Sport Evolution (7599599752).jpg",
    "e30 m3":             "File:BMW M3 E30 Sport Evolution (7599599752).jpg",
    "m3 e36":             "File:BMW M3 E36 Estoril Blue.jpg",
    "e36 m3":             "File:BMW M3 E36 Estoril Blue.jpg",
    "m3 e46":             "File:2003 BMW M3 (E46) Coupe (10384134605).jpg",
    "e46 m3":             "File:2003 BMW M3 (E46) Coupe (10384134605).jpg",
    "lancia delta":       "File:Lancia Delta HF Integrale Evoluzione (Group A) 1X7A7246.jpg",
    "delta integrale":    "File:Lancia Delta HF Integrale Evoluzione (Group A) 1X7A7246.jpg",
    "mercedes-benz e55 amg w210": "File:Mercedes-Benz E55 AMG (5).jpg",
    "e55 amg w210":       "File:Mercedes-Benz E55 AMG (5).jpg",
    "e55 amg w211":       "File:Mercedes-AMG E55 (W211) Washington DC Metro Area, USA.jpg",
    "mercedes-benz e55 amg w211": "File:Mercedes-AMG E55 (W211) Washington DC Metro Area, USA.jpg",
    "subaru impreza 22b": "File:1998 Subaru Impreza 22B STi (10389).jpg",
    "22b sti":            "File:1998 Subaru Impreza 22B STi (10389).jpg",
    "audi a4 1.8t quattro sport b5": "File:Audi A4 B5 (with facelift) blue sedan.jpg",
    "audi a4 b5":         "File:Audi A4 B5 (with facelift) blue sedan.jpg",
    "porsche boxster 986": "File:Porsche Boxster (986) Brilliant Black.jpg",
    "bmw m roadster":     "File:BMW Z3 M Roadster (1).jpg",
    "m coupe z3":         "File:BMW Z3 M Coupe.jpg",
    "fairlady z z34":     "File:Nissan 370Z (Z34) front.jpg",
    "bmw m5 e60":         "File:BMW M5 (E60) front.jpg",
    "e60 m5":             "File:BMW M5 (E60) front.jpg",
    "bmw e92 m3":         "File:BMW M3 (E92) Coupe front.jpg",
    "e92 m3":             "File:BMW M3 (E92) Coupe front.jpg",
    "bmw m5 e39":         "File:BMW M5 E39 1.jpg",
    "e39 m5":             "File:BMW M5 E39 1.jpg",
    "audi r8 v8":         "File:Audi R8 V8 front.jpg",
    "audi rs6":           "File:Audi RS 6 Avant (C6) front.jpg",
    "audi rs5":           "File:Audi RS5 Coupe front.jpg",
    "lexus is-f":         "File:Lexus IS F front.jpg",
    "lexus is f":         "File:Lexus IS F front.jpg",
    "mazda rx-8":         "File:Mazda RX-8 front.jpg",
    "ford focus rs mk2":  "File:Ford Focus RS Mk2 front.jpg",
    "toyota mark x":      "File:Toyota Mark X (X120) front.jpg",
    "mazda atenza":       "File:Mazda Atenza GG.jpg",
    "audi quattro 20v":   "File:Audi Quattro green.jpg",
    "190e 2.5-16":        "File:1993 190E 2.3.jpg",
    "civic type r ek9":   "File:Honda CIVIC TYPE R (EK9) right.JPG",
    "honda nsx (na":      "File:Honda E-NA1 NSX (22022010324).jpg",
    "nsx (na1":           "File:Honda E-NA1 NSX (22022010324).jpg",
    "nsx (na2":           "File:Honda E-NA1 NSX (22022010324).jpg",
    "porsche boxster 986": "File:2000 Porsche Boxster S James Dean 550 Spyder Recreation.jpg",
}


def _commons_override_for(car_name: str):
    nm = car_name.lower()
    for needle, filename in COMMONS_OVERRIDES.items():
        if needle in nm:
            return filename
    return None


async def resolve_commons_file(client: httpx.AsyncClient, file_title: str, width: int = 1280):
    """Resolve File:Foo.jpg to a direct upload.wikimedia.org thumbnail URL."""
    params = {
        "action": "query",
        "format": "json",
        "titles": file_title,
        "prop": "imageinfo",
        "iiprop": "url",
        "iiurlwidth": width,
    }
    try:
        r = await client.get("https://commons.wikimedia.org/w/api.php", params=params, headers=UA, timeout=10)
        data = r.json()
        for _, page in (data.get("query", {}) or {}).get("pages", {}).items():
            ii = (page.get("imageinfo") or [])
            if ii:
                return ii[0].get("thumburl") or ii[0].get("url")
    except Exception:
        return None
    return None


async def fetch_image(client: httpx.AsyncClient, car: dict):
    name = car["car_name"]

    # 1. Commons direct file override (highest precedence — for cars Wikipedia REST
    #    consistently returns the wrong facelift image)
    commons_file = _commons_override_for(name)
    if commons_file:
        url = await resolve_commons_file(client, commons_file)
        if url:
            return _resize_url(url, 1280), commons_file

    # 2. Wikipedia article override (curated slug)
    override = _override_for(name)
    candidates = [override] if override else _candidates(name)
    for slug in candidates:
        url = WIKI.format(slug=slug)
        try:
            r = await client.get(url, headers=UA, timeout=10)
        except Exception:
            continue
        if r.status_code != 200:
            continue
        try:
            data = r.json()
        except Exception:
            continue
        img = (data.get("originalimage") or {}).get("source") or (data.get("thumbnail") or {}).get("source")
        if img:
            return _resize_url(img, 1280), slug
    return None, None


async def main(force: bool = False):
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    mc = AsyncIOMotorClient(mongo_url)
    db = mc[db_name]
    q = {} if force else {"$or": [{"image_url": {"$exists": False}}, {"image_url": None}, {"image_url": ""}]}
    cars = await db.vrt_registry.find(q).to_list(5000)
    print(f"[sync_car_images] processing {len(cars)} cars (force={force})")

    sem = asyncio.Semaphore(CONCURRENCY)
    found = 0
    misses = []

    async with httpx.AsyncClient() as http:
        async def worker(c):
            nonlocal found
            async with sem:
                url, slug = await fetch_image(http, c)
                if url:
                    await db.vrt_registry.update_one({"id": c["id"]}, {"$set": {"image_url": url, "image_slug": slug}})
                    found += 1
                else:
                    misses.append(c["car_name"])

        await asyncio.gather(*(worker(c) for c in cars))

    print(f"[sync_car_images] done. matched={found}/{len(cars)}  missing={len(misses)}")
    for m in misses[:30]:
        print(f"   miss: {m}")
    mc.close()


if __name__ == "__main__":
    force = "--force" in sys.argv
    asyncio.run(main(force=force))
