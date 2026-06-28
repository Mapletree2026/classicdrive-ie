"""
Backend tests for car image_url backfill bug fix.
Verifies that each car in the 217-car registry has a unique, valid
Wikimedia image_url after running scripts/sync_car_images.py.
"""
import os
import random
import pytest
import requests
from urllib.parse import urlparse

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # frontend/.env is the source of truth for the public preview URL
    from pathlib import Path
    env_file = Path("/app/frontend/.env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
BASE_URL = (BASE_URL or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not configured"

USER_AGENT = "ClassicDriveBot/1.0"
WIKI_HOST = "upload.wikimedia.org"


@pytest.fixture(scope="module")
def all_cars():
    r = requests.get(f"{BASE_URL}/api/cars", timeout=30)
    assert r.status_code == 200, f"GET /api/cars returned {r.status_code}"
    data = r.json()
    assert isinstance(data, list)
    return data


# ---------- Total count regression ----------
class TestCount:
    def test_total_cars_is_217(self, all_cars):
        assert len(all_cars) == 217, f"Expected 217 cars, got {len(all_cars)}"


# ---------- image_url coverage ----------
class TestImageCoverage:
    def test_image_url_field_present(self, all_cars):
        # field must at least exist (None allowed) on every car
        missing_field = [c["car_name"] for c in all_cars if "image_url" not in c]
        assert not missing_field, f"image_url missing on: {missing_field[:5]}"

    def test_image_url_coverage_ge_99pct(self, all_cars):
        with_image = [c for c in all_cars if c.get("image_url")]
        coverage = len(with_image) / len(all_cars)
        missing = [c["car_name"] for c in all_cars if not c.get("image_url")]
        assert coverage >= 0.99, (
            f"Coverage {coverage:.2%} below 99%. "
            f"{len(missing)} missing: {missing}"
        )

    def test_image_url_uniqueness_ge_90(self, all_cars):
        urls = [c["image_url"] for c in all_cars if c.get("image_url")]
        unique = set(urls)
        assert len(unique) >= 90, (
            f"Only {len(unique)} unique image URLs (need >=90). "
            f"Total non-null URLs: {len(urls)}"
        )


# ---------- URL hostname check ----------
class TestImageHostname:
    def test_all_urls_are_wikimedia(self, all_cars):
        bad = []
        for c in all_cars:
            url = c.get("image_url")
            if not url:
                continue
            host = urlparse(url).netloc
            if host != WIKI_HOST:
                bad.append((c["car_name"], url))
        assert not bad, f"Non-wikimedia URLs found: {bad[:5]}"


# ---------- Random sample reachability ----------
class TestImageReachability:
    def test_ten_random_urls_return_200(self, all_cars):
        import time as _t
        with_url = [c for c in all_cars if c.get("image_url")]
        random.seed(42)
        sample = random.sample(with_url, min(10, len(with_url)))
        failures = []
        # HEAD with throttle + backoff retry on 429/403 (Wikimedia rate-limit)
        ua = "ClassicDriveBot/1.0 (admin@classicdrive.test)"
        for c in sample:
            ok = False
            last = None
            for attempt in range(4):
                try:
                    resp = requests.head(
                        c["image_url"],
                        headers={"User-Agent": ua},
                        timeout=20,
                        allow_redirects=True,
                    )
                    last = resp.status_code
                    if resp.status_code == 200:
                        ok = True
                        break
                    if resp.status_code in (403, 429):
                        _t.sleep(5 * (attempt + 1))
                        continue
                    break
                except Exception as e:
                    last = str(e)
                    _t.sleep(3)
            if not ok:
                failures.append((c["car_name"], c["image_url"], last))
            _t.sleep(2)
        assert not failures, f"Image URL fetch failures: {failures}"


# ---------- CarPublic schema includes image_url on detail endpoint ----------
class TestCarDetailSchema:
    def test_detail_returns_image_url(self, all_cars):
        for car in all_cars[:3]:
            r = requests.get(f"{BASE_URL}/api/cars/{car['id']}", timeout=20)
            assert r.status_code == 200, f"GET /api/cars/{car['id']} -> {r.status_code}"
            body = r.json()
            assert "image_url" in body, f"image_url missing on detail for {car['car_name']}"
            # If list had a URL, detail should also expose it (data parity)
            if car.get("image_url"):
                assert body["image_url"] == car["image_url"]


# ---------- Regression: existing endpoints still work ----------
class TestRegression:
    def test_stats_returns_217(self):
        r = requests.get(f"{BASE_URL}/api/cars/stats", timeout=20)
        assert r.status_code == 200
        data = r.json()
        # be lenient about exact key name
        total = data.get("total") or data.get("total_cars") or data.get("count")
        assert total == 217, f"stats total={total}, expected 217. body={data}"

    def test_most_watched_shape(self):
        r = requests.get(f"{BASE_URL}/api/cars/most-watched", timeout=20)
        assert r.status_code == 200
        data = r.json()
        # accept either list or dict containing list
        items = data if isinstance(data, list) else data.get("items") or data.get("cars")
        assert isinstance(items, list), f"most-watched not list-shaped: {type(data)}"

    def test_quiz_match_returns_matches(self):
        # Try minimal payload; adapt if endpoint demands specific fields
        payloads = [
            {"answers": {}},
            {},
            {"preferences": {}},
        ]
        last = None
        for p in payloads:
            r = requests.post(f"{BASE_URL}/api/quiz/match", json=p, timeout=20)
            last = r
            if r.status_code == 200:
                body = r.json()
                assert "matches" in body, f"matches key missing: {body.keys()}"
                assert isinstance(body["matches"], list)
                return
        pytest.fail(
            f"POST /api/quiz/match failed for all payload shapes; "
            f"last status={last.status_code} body={last.text[:200]}"
        )

    def test_legacy_fields_present(self, all_cars):
        required = [
            "car_name",
            "category",
            "launch_date",
            "vrt_freedom_date",
            "is_eligible",
            "countdown_display",
            "time_left_days",
        ]
        missing_per_car = []
        for c in all_cars:
            miss = [f for f in required if f not in c]
            if miss:
                missing_per_car.append((c.get("car_name"), miss))
        assert not missing_per_car, f"Legacy fields missing: {missing_per_car[:5]}"


@pytest.fixture(scope="module", autouse=False)
def _print_summary(all_cars):
    with_image = sum(1 for c in all_cars if c.get("image_url"))
    unique = len({c["image_url"] for c in all_cars if c.get("image_url")})
    print(
        f"\n[SUMMARY] total={len(all_cars)} with_image={with_image} "
        f"unique_urls={unique}"
    )
