# Ojaa platform admin (`admin_fe`)

Internal SPA for platform operators. Talks to `pos_merge_bk` at `/api/admin/*`.

## Setup

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to your API origin (no trailing slash).
2. `npm install`
3. `npm run dev` — default Vite port `5173`.

## Build

`npm run build` → output in `dist/`. Serve behind HTTPS in production.

## E2E (optional)

`npx playwright install` once, then `npm run test:e2e` (set `ADMIN_E2E_BASE_URL` if not using `127.0.0.1:5173`).

## Stack

Vite 5, React 19, TypeScript, axios, react-router-dom, recharts.
