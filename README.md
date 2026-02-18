# LedgerPro (MVC + React + Ant Design + MongoDB)

## Architecture

- Backend: `/Users/saroshkhan/work/projectA/backend` (JavaScript, MVC)
- Frontend: `/Users/saroshkhan/work/projectA/frontend` (Vite + React + Ant Design + React Router + Axios)
- Database: MongoDB Atlas

## Backend Layers

- Routes: `/Users/saroshkhan/work/projectA/backend/src/routes`
- Controllers: `/Users/saroshkhan/work/projectA/backend/src/controllers`
- Services: `/Users/saroshkhan/work/projectA/backend/src/services`
- Models: `/Users/saroshkhan/work/projectA/backend/src/models`
- DB: `/Users/saroshkhan/work/projectA/backend/src/db/mongo.js`

## Features

- Multi-user auth (register/login/logout)
- Multiple active sessions supported
- Entity CRUD
- Transaction CRUD (sales/purchases + GST)
- Partial/full payment tracking
- Due reminders
- GST bill generation (single/multiple sales)
- Bill PDF print flow
- Reports + CSV exports

## MongoDB Connection

Backend reads MongoDB URI from `MONGODB_URI`.
If not provided, it uses the Atlas URI configured in:
- `/Users/saroshkhan/work/projectA/backend/src/config/constants.js`

You can override safely using env vars:
- `MONGODB_URI`
- `MONGODB_DB` (default: `ledger_pro`)

## Setup

1. Install backend dependency:
   - `cd /Users/saroshkhan/work/projectA`
   - `npm install`

2. Install frontend dependencies:
   - `cd /Users/saroshkhan/work/projectA/frontend`
   - `npm install`

3. Run backend API (terminal 1):
   - `cd /Users/saroshkhan/work/projectA`
   - `npm run dev:api`

4. Run frontend (terminal 2):
   - `cd /Users/saroshkhan/work/projectA`
   - `npm run dev:web`

5. Open:
   - `http://localhost:5173`

## Production frontend build

1. `cd /Users/saroshkhan/work/projectA`
2. `npm run build:web`
3. `npm start`
4. Open `http://localhost:4000`

Backend serves built frontend from `frontend/dist`.

## Mobile App Wrapper (Capacitor)

The project now includes Capacitor wrappers under:
- `/Users/saroshkhan/work/projectA/frontend/android`
- `/Users/saroshkhan/work/projectA/frontend/ios`

### One-time setup

1. `cd /Users/saroshkhan/work/projectA/frontend`
2. `npm install`
3. Configure API URL for mobile builds if needed:
   - copy `/Users/saroshkhan/work/projectA/frontend/.env.example` to `frontend/.env`
   - default in native wrapper is `http://localhost:4000/api`
   - for physical device testing, set `VITE_API_BASE_URL` to your machine LAN IP, for example:
     - `VITE_API_BASE_URL=http://192.168.1.23:4000/api`

### Build and sync mobile assets

From repo root:
1. `npm run mobile:build`

This builds the web app and syncs it to Android/iOS wrappers.

For login/API to work in simulator, run backend locally before launching app:
1. `npm run dev:api`

### Open native projects

From repo root:
1. Android Studio: `npm run mobile:android`
2. Xcode: `npm run mobile:ios`

### Optional run commands

From repo root:
1. `npm run mobile:run:android`
2. `npm run mobile:run:ios`
