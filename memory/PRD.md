# ClassicDrive.ie — PRD

## Original Problem Statement
Initialize a full-stack, mobile-responsive web application (originally "Sovereign Automotive", later "RetroDrive.ie", now **ClassicDrive.ie** — domain `classicdrive.ie` secured 2026-02).
1. Build a primary database table "VRT_Registry" with columns: ID, Car_Name, Category, Launch_Date, VRT_Freedom_Date, External_Link.
2. Implement backend logic to calculate "Time_Left" by subtracting the current date/time from VRT_Freedom_Date.
3. Conditional visibility UI badge: If Time_Left <= 0 display "👑 €200 FLAT VRT ELIGIBLE" green, else "⏳ COUNTDOWN ACTIVE".
4. Upper Navigation Header with crisp Category filter toggle between "Performance / JDM" and "Everyday / Euro Classic".

## User Choices
- Data seeded from user-provided CSV (188 cars 1989-2010, JDM + Euro Classic)
- External_Link: custom URL per car (nullable, not in source data)
- Authentication: deferred — public directory only; auth (Email Magic Link via Resend) only needed for Sentiment voting & Watchlist
- Countdown format: ">30 days = 'X Months, Y Days Remaining'", "≤30 days = bold 'X Days Remaining'", "passed = hide & green badge"
- Design: motorsport heritage / Swiss high-contrast (Barlow Condensed + IBM Plex Mono + Chivo)
- Re-skin option available after first review

## Architecture
- Backend: FastAPI + MongoDB (motor). Routes prefixed `/api`.
- Frontend: React (CRA + craco), Tailwind, shadcn/ui available.
- Seed: `/app/backend/cars_data.csv` loaded once on startup into `vrt_registry` collection.
- Status computation: pure function `_compute_status(vrt_freedom_iso)` in server.py.

## Implemented (2026-02)
- VRT_Registry model + Mongo seeding (188 cars, 100 JDM / 88 Euro Classic)
- Endpoints: `GET /api/cars`, `GET /api/cars?category=...&eligible_only=...`, `GET /api/cars/categories`, `GET /api/cars/stats`, `GET /api/cars/{id}`
- Frontend: sticky header with brand + segmented category toggle (desktop) + mobile toggle row, hero, scrolling ticker, stat bar, responsive 1–4 col card grid, search filter, footer
- Conditional badges + countdown formatting on cards
- Motorsport editorial aesthetic (Barlow Condensed, IBM Plex Mono, Chivo)
- **Iteration 2 (2026-02):** Email Magic Link auth (MOCKED Resend — backend returns the link in `/api/auth/request-link` response for dev). Endpoints `/api/auth/request-link`, `/api/auth/verify`, `/api/auth/me`, `/api/auth/logout`. JWT (14-day) stored client-side in `localStorage.sa_token`, sent as `Authorization: Bearer ...`. Tokens are SHA-256-hashed in DB, single-use, 15-min TTL with Mongo TTL index.
- **Sentiment Index (Buy / Hold / Sell):** `POST /api/cars/{id}/vote` (auth, upsert), `GET /api/cars/{id}/sentiment` (public). Vote model with unique compound index `(car_id,user_id)` so the same user can change vote anytime — never duplicates. Dedicated `/car/:carId` detail page with stacked sentiment bar, 3 vote buttons, "YOUR VOTE" badge, percentages visible publicly.
- Frontend: `AuthProvider` + `LoginDialog` modal with dev-mode magic link display, `AuthVerify` page, user menu with email + logout in header.
- Affiliate sourcing links with UTM tags (DoneDeal, Carzone, AutoTrader UK, Goo-net), Trending market sentiment ticker, "Suggest a Car" form, Year filter.
- **Iteration 7 (2026-02):** Heritage Light theme (British Racing Green on cream), rebranded Sovereign Auto → RetroDrive.ie → **ClassicDrive.ie**. Custom domain `classicdrive.ie` secured. Code pushed to public GitHub: https://github.com/Mapletree2026/retrodrive-ie. Sanity scan confirmed `.env` files correctly gitignored (HTTP 404 on GitHub raw), no secrets leaked.
- **Iteration 8 (2026-02):** VRT Freedom Alert email-capture widget on car detail pages. New collection `vrt_notifications` with unique `(car_id, email)` index. Endpoints `POST /api/cars/{id}/notify` (idempotent upsert; rejects already-eligible cars with 400 and unknown cars with 404) and `GET /api/cars/{id}/notify/count`. Widget renders only when `!car.is_eligible`, shows live watcher count, countdown badge, and green success state on subscribe.
- **Iteration 9 (2026-02):** Future-classics expansion — added 29 popular 1997-1998 models (15 JDM + 14 Euro Classic, e.g. BMW M3 E36 Evolution, Porsche 993 Carrera S, R33 GT-R V-Spec Nür, 22B STi, Evo IV/V, M5 E39, 996 Carrera, Lotus Elise S1, Honda Civic Type R EK9). Their `VRT_Freedom_Date` is set to launch_year+30 (2027-2028) so the new email-capture widget shows live countdowns ("8 Months, 16 Days Remaining" etc.). Seed function refactored to upsert-per-row (CSV is now single source of truth, safe to re-run). Total catalogue: **217 cars** (188 eligible + 29 pending).
- **Iteration 10 (2026-02) — P0 SHIPPED:** "Most-Watched Releases" carousel on homepage. New endpoint `GET /api/cars/most-watched?limit=8` (1-24) aggregates `vrt_notifications`, joins to `vrt_registry`, filters pending-only, sorts by `(watchers desc, freedom_date asc)`, and pads with closest-to-eligible cars when fewer than `limit` have subscribers. Front-end `<MostWatchedCarousel />` mounted between hero and directory grid: 4-up grid on desktop, horizontal scroll-snap on mobile, skeleton loader, scroll arrows, watcher chip, live countdown, deep-link to car detail. Section hides cleanly if API returns `[]`. Verified live: top card "1997 BMW M3 E36 Evolution · 5 watching · 8 Months 16 Days Remaining", correct sort order, click-through to detail works.
- 100% backend + frontend tests pass (iterations 1–6)

## Personas
1. Irish classic-car enthusiast tracking when their car drops to €200 VRT
2. JDM importer scouting for soon-eligible vehicles
3. SEO crawler — public directory indexable

## Backlog
### P0
- [ ] Email Magic Link auth via Resend (only gates voting + watchlist)
### P1
- [ ] Sentiment Index per car (Buy / Hold / Sell voting + tally bar)
- [ ] Personal Watchlist (save cars, view in /watchlist)
- [ ] Per-car detail page with external link management
- [ ] Admin CRUD for VRT_Registry (add/edit/remove cars, set External_Link)
### P2
- [ ] Filter by year/decade, sort by closest-to-eligible
- [ ] Per-card images (Unsplash + manual override)
- [ ] CSV bulk import endpoint
- [ ] OG tags / SEO sitemap for public pages
- [ ] Re-skin design variants (light editorial, brutalist, etc.)

## Next Actions
1. Switch `EMAIL_MODE` mock → resend once user provides `RESEND_API_KEY`
2. Add Price + Mileage filters once richer CSV (`Avg_Price_EUR`, `Avg_Mileage_KM`) is provided
3. Build Personal Watchlist endpoints + UI
4. Wire real affiliate partner IDs (currently placeholders)
