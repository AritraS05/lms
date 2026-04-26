# LMS — Loan Management System

A full-stack Loan Management System with role-based workflows for sales, sanction, disbursement, collection, and borrower self-service.

- **Frontend** — Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend** — Node.js + Express + TypeScript
- **Database** — MongoDB + Mongoose
- **Auth** — JWT signed by the backend, stored in an HTTP-only cookie set by Next.js Route Handlers

> Detailed auth design is in [`AUTH_README.md`](./AUTH_README.md).

## Roles

`Admin`, `Sales`, `Sanction`, `Disbursement`, `Collection`, `Borrower`. Default on signup is `Borrower`.

## Repository layout

```
lms/
  app/                 # Next.js App Router (pages + API route handlers)
    api/auth/          #   login, signup, logout, me — proxy to backend, set cookie
    login/  signup/    #   public pages
    dashboard/         #   protected page
    borrower/          #   borrower workspace
  components/          # shared React components
  lib/                 # client/server helpers (api.ts, getCurrentUser.ts)
  proxy.ts             # Next.js 16 "proxy" (formerly middleware) — route protection
  public/              # static assets
  backend/             # Express API
    src/
      config/          #   env loader, mongoose connect
      models/          #   User, Loan, Payment, BorrowerProfile
      controllers/     #   auth, sales, sanction, disbursement, collection, borrower, loan, ops
      routes/          #   /api/* routers
      middleware/      #   requireAuth, requireRole, errorHandler
      utils/           #   JWT sign/verify, cookie helpers
      app.ts  server.ts
  .env.local.example   # frontend env template
  backend/.env.example # backend env template
```

## Prerequisites

- **Node.js** 20+ and npm
- **MongoDB** 6+ running locally (or a MongoDB Atlas connection string)

## Setup

Run the backend and frontend in two separate terminals.

### 1. Backend

```bash
cd backend
cp .env.example .env       # edit JWT_SECRET, MONGODB_URI as needed
npm install
npm run dev                # starts on http://localhost:5001
```

If you'd rather build and run the compiled output:

```bash
npm run build
npm start
```

### 2. Frontend

From the project root, in a second terminal:

```bash
cp .env.local.example .env.local
npm install
npm run dev                # starts on http://localhost:3000
```

Visit <http://localhost:3000>. Unauthenticated visits are redirected to `/login`; once signed in you'll land on `/dashboard` (or the role-specific workspace).

## Environment variables

### Backend — `backend/.env`

A working template lives at `backend/.env.example`:

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/lms
JWT_SECRET=replace-me-with-a-long-random-string
JWT_EXPIRES_IN=7d
COOKIE_NAME=lms_token
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
```

| Var              | Default                           | Purpose                                           |
|------------------|-----------------------------------|---------------------------------------------------|
| `PORT`           | `5001`                            | API port                                          |
| `MONGODB_URI`    | `mongodb://127.0.0.1:27017/lms`   | Mongo connection string                           |
| `JWT_SECRET`     | —                                 | **Required.** Long random string for signing JWTs |
| `JWT_EXPIRES_IN` | `7d`                              | Token lifetime                                    |
| `COOKIE_NAME`    | `lms_token`                       | Cookie name (must match the frontend)             |
| `CLIENT_ORIGIN`  | `http://localhost:3000`           | CORS allow-list                                   |
| `NODE_ENV`       | `development`                     | Affects cookie flags (`Secure`, `SameSite`)       |

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend — `.env.local`

A working template lives at `.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
AUTH_COOKIE_NAME=lms_token
```

| Var                   | Default                  | Purpose                                                   |
|-----------------------|--------------------------|-----------------------------------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001`  | Where the Next.js Route Handlers forward API calls        |
| `AUTH_COOKIE_NAME`    | `lms_token`              | Cookie name read by `proxy.ts` (must match `COOKIE_NAME`) |

> **Heads up:** `AUTH_COOKIE_NAME` on the frontend and `COOKIE_NAME` on the backend must match — they refer to the same cookie.

## Scripts

### Frontend (root)

| Command         | What it does                              |
|-----------------|-------------------------------------------|
| `npm run dev`   | Start Next.js dev server (`:3000`)        |
| `npm run build` | Production build                          |
| `npm start`     | Serve the production build                |
| `npm run lint`  | ESLint                                    |

### Backend (`backend/`)

| Command             | What it does                               |
|---------------------|--------------------------------------------|
| `npm run dev`       | Start Express with `ts-node-dev` (`:5001`) |
| `npm run build`     | Compile TypeScript to `dist/`              |
| `npm start`         | Run `dist/server.js`                       |
| `npm run typecheck` | `tsc --noEmit`                             |
