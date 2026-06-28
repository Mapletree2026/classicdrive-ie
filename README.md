# ClassicDrive.ie

> The Irish VRT freedom registry for classic JDM & European cars.
> Track exactly when each modern classic hits Ireland's €200 flat-rate VRT exemption.

ClassicDrive.ie is a full-stack web app that catalogues 180+ enthusiast cars (Performance / JDM and Everyday / Euro Classic), surfaces a live countdown to each vehicle's 30-year VRT freedom date, aggregates community Buy / Hold / Sell sentiment, and deep-links to active Irish & UK sourcing channels.

## Tech Stack

- **Frontend:** React (CRA + CRACO), Tailwind CSS, Shadcn UI
- **Backend:** FastAPI (Python), Motor (async MongoDB driver)
- **Database:** MongoDB
- **Auth:** Magic-link JWT (email delivery is currently mocked for dev)
- **Theme:** Heritage Light — British Racing Green on cream

## Project Structure

```
/app
├── backend/              FastAPI API + 188-car CSV seed
│   ├── server.py
│   ├── cars_data.csv
│   └── requirements.txt
├── frontend/             React SPA
│   ├── public/
│   └── src/
│       ├── components/   Header, CarCard, SuggestionForm, ...
│       ├── pages/        Directory, CarDetail, AuthVerify
│       └── lib/          api, auth, sourcingLinks
└── memory/               PRD + test credentials (gitignored)
```

## Running Locally

The project is managed by `supervisor` in the Emergent environment. Locally:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend
cd frontend
yarn install
yarn start
```

Required env vars (never commit these — see `.env.example` pattern):

**backend/.env**
```
MONGO_URL=...
DB_NAME=...
JWT_SECRET=...
EMAIL_MODE=mock          # switch to "resend" + add RESEND_API_KEY for real delivery
```

**frontend/.env**
```
REACT_APP_BACKEND_URL=...
```

## Key Features

- **VRT Freedom Countdown** — live `Time_Left` calc against each car's `VRT_Freedom_Date`. Green crown badge once eligible, amber hourglass while counting down.
- **Category Filter** — Performance / JDM vs Everyday / Euro Classic toggle.
- **Year Filter** — narrow the registry by launch year.
- **Sentiment Index** — authenticated Buy / Hold / Sell voting with aggregated stats and a trending ticker.
- **Affiliate Sourcing** — deep-linked search URLs for DoneDeal, Carzone, AutoTrader UK, Goo-net, etc., with UTM tagging.
- **Suggest a Car** — public form for community submissions.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Request magic link (returns dev link in mock mode) |
| GET  | `/api/auth/verify` | Exchange magic token for JWT |
| GET  | `/api/cars` | Public car directory |
| GET  | `/api/cars/{id}` | Single car detail |
| POST | `/api/cars/{id}/vote` | Cast Buy / Hold / Sell (auth) |
| GET  | `/api/cars/{id}/sentiment` | Aggregated vote stats |
| GET  | `/api/trending` | Market-wide sentiment snapshot |
| POST | `/api/suggestions` | Submit a new car suggestion |

## License

© ClassicDrive.ie — All rights reserved.
