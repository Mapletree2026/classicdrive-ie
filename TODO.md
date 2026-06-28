# ClassicDrive.ie — Phase 2 Backlog

Locked-in sprint board for the next iteration. Last shipped: **2026-02** (217-car registry, VRT Freedom Alert widget, ClassicDrive.ie rebrand).

---

## 🔥 P0 — Headline Feature

### "Most-Watched 2027 Releases" carousel on homepage
Turn the `vrt_notifications` watcher list into instant social proof and accelerate pre-launch list growth.

- **Backend**
  - New endpoint `GET /api/cars/most-watched?limit=8`
    - Aggregate `vrt_notifications` → `{car_id, watchers}` sorted desc
    - Join against `vrt_registry`, return only `!is_eligible` cars
    - Pad with random pending cars if fewer than `limit` have subscribers (so the row is never empty at launch)
  - Reuse the existing `_compute_status()` helper for countdown payload
- **Frontend**
  - New `<MostWatchedCarousel />` component, mounted on `Directory.jsx` above the existing stat bar / under the hero
  - Horizontal scroll on mobile, 4-up grid on desktop
  - Each card: car name · category badge · live countdown · **🔥 X watching** chip · link to `/car/:id`
  - Skeleton state while loading; hide entire section gracefully if API returns `[]`
- **Acceptance**
  - Carousel reflects new subscriptions within one page load
  - Sorted strictly by watcher count desc, ties broken by closest VRT freedom date

---

## 🟡 P1 — Activate Real Email Delivery

### Switch `EMAIL_MODE` mock → resend
- Add `RESEND_API_KEY` to `backend/.env` (obtain from https://resend.com/api-keys)
- Verify a sender domain on Resend (suggest `notify@classicdrive.ie` once DNS is wired)
- Wire `send_magic_link_email()` to use the Resend SDK when `EMAIL_MODE=resend`
- Add tiny branded HTML template (BRG header, single CTA button)

### Daily VRT-eligibility cron
- New background job (FastAPI startup task + asyncio loop, or a separate `worker.py` under supervisor)
- Runs every 24h at 09:00 Europe/Dublin
- Query: cars whose `vrt_freedom_date` crossed midnight today AND have un-notified subscribers
- For each subscriber → send email "Your car just hit VRT freedom 🏁", then set `notified_at=now()`
- Idempotent: skip rows where `notified_at` is set
- Log every batch to `/var/log/supervisor/cron.log` for auditing

---

## 🟢 P2 — Data & Polish

### Refresh existing 188 cars' freedom dates
- Existing CSV stores `VRT_Freedom_Date = launch_date` (legacy bug → all marked eligible)
- One-shot migration: `vrt_freedom_date = launch_date + 30 years` for every row
- Re-run idempotent seed; verify historical countdowns now accurate
- Will also surface the notify widget across the original 188

### Personal Watchlist (authenticated)
- `POST /api/watchlist` (auth) — add a car
- `DELETE /api/watchlist/{car_id}` (auth) — remove
- `GET /api/watchlist` (auth) — list user's saved cars with computed status
- New `/watchlist` page in frontend; "Save to watchlist" button on car detail
- Reuse existing JWT magic-link auth

### Real affiliate partner IDs
- File: `frontend/src/lib/sourcingLinks.js`
- Replace placeholder IDs with signed partner programs:
  - DoneDeal: apply via https://www.donedeal.ie/affiliate (Irish marketplace)
  - Carzone, AutoTrader UK, Goo-net Exchange (JP exports)
- Move IDs to `REACT_APP_AFF_*` env vars (already wired in code, just need values)

### Rename GitHub repo
- Manual UI step: GitHub → Settings → Rename `retrodrive-ie` → `classicdrive-ie`
- GitHub auto-redirects the old URL — no broken links

---

## 📝 Nice-to-haves (backlog, no commitment)

- Add Price + Mileage filters once a richer CSV with `Avg_Price_EUR` / `Avg_Mileage_KM` columns is available
- Per-car hero images (Unsplash + manual override)
- OG tags / sitemap.xml for SEO
- Admin CRUD for the VRT Registry (add/edit/remove + set per-car `external_link`)
- Mobile PWA install prompt
- Public RSS feed of newly-eligible cars

---

## 🧱 Engineering Notes for Next Sprint

- All env vars come from `.env` only — never hardcode keys
- Continue using `data-testid` on every interactive element (testing agent depends on it)
- Existing collections: `vrt_registry`, `users`, `magic_links`, `votes`, `vrt_notifications`, `suggestions`
- Heritage Light theme variables live in `frontend/src/index.css` (do not introduce a second theme)
- Custom domain `classicdrive.ie` is secured — once DNS points at the deploy, update `REACT_APP_BACKEND_URL` and `FRONTEND_URL`

---

_Generated 2026-02 — ClassicDrive.ie Phase 2 sprint plan._
