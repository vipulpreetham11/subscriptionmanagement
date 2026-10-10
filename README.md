# Subscription Management Dashboard (MERN)

A college-project-ready MERN application to create, view, edit, delete, search, and track subscriptions and renewals.

## Features
- Dashboard cards: total, active, renewals due in 7 days, monthly-equivalent spend
- Subscription CRUD
- Search and status filters
- Renewal date/status indicators
- MongoDB persistence via Mongoose
- Optional JWT authentication with register/login
- Per-user data isolation when authentication is enabled
- Seed script for demo subscriptions

## Requirements
- Node.js 18+
- MongoDB local instance or MongoDB Atlas connection string

## Setup

### 1. Backend
```powershell
cd server
Copy-Item .env.example .env
```
Edit `server/.env` and set `MONGODB_URI`. Set a long random `JWT_SECRET`.

```powershell
npm install
npm run seed
npm run dev
```
API runs at `http://localhost:5000`.

The seed script creates demo data only if the database has no subscriptions. Demo records have no owner and appear in unauthenticated mode. If you use login, register a user and create your own records.

### 2. Frontend
Open another terminal:
```powershell
cd client
Copy-Item .env.example .env
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Authentication
Authentication is enabled by default. Register a user from the login screen. JWT is stored in localStorage for this college demo. For production, prefer secure, HttpOnly cookies, add rate limiting, email verification, password reset, and stricter deployment configuration.

To run without login for a classroom demo, set `VITE_AUTH_ENABLED=false` in `client/.env` and `AUTH_ENABLED=false` in `server/.env`. Restart both servers. Do not disable authentication for a public deployment.

## API
- `POST /api/auth/register` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `GET /api/auth/me` — current user (requires token)
- `GET /api/subscriptions` — list, optional `?search=...&status=Active`
- `GET /api/subscriptions/:id` — read one
- `POST /api/subscriptions` — create
- `PUT /api/subscriptions/:id` — update
- `DELETE /api/subscriptions/:id` — delete
- `GET /api/dashboard/stats` — summary metrics

Subscription fields: `serviceName`, `plan`, `amount`, `billingCycle` (`Monthly`, `Yearly`, `Quarterly`, `Weekly`), `startDate`, `renewalDate`, `status` (`Active`, `Paused`, `Cancelled`), `notes`.

## Notes
- Amounts are assumed to be INR (₹).
- Monthly equivalent normalizes yearly / quarterly / weekly amounts for dashboard reporting.
- A subscription is “due soon” when active and its renewal date falls from today through the next 7 days.
- “Overdue” is derived from an active subscription whose renewal date is before today; the record's stored status remains Active until edited.
- This is a tracking dashboard, not a payment processor. It does not charge cards or automatically renew services.
