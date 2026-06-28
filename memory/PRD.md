# Sovereign Automotive — PRD

## Original Problem Statement
Initialize a full-stack, mobile-responsive web application called "Sovereign Automotive".
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
- 100% backend + frontend test pass (iteration_1)

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
1. Add Email Magic Link auth (Resend) — gating only voting + watchlist
2. Build Sentiment Index endpoints + UI
3. Build Watchlist endpoints + UI
4. Add admin interface to set per-car External_Link (custom URLs)
