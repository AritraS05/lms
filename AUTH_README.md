# LMS — Authentication (Part 1)

This is the authentication layer for the Loan Management System. It covers signup, login, logout, an authenticated `/me` endpoint, and route protection for the Next.js app.

## Stack

- **Frontend** — Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend** — Node.js + Express.js + TypeScript
- **Database** — MongoDB + Mongoose
- **Auth** — JWT signed on the backend, stored in an HTTP-only cookie set by Next.js Route Handlers

## Roles

`Admin`, `Sales`, `Sanction`, `Disbursement`, `Collection`, `Borrower`. Default on signup is `Borrower`.

## Project layout

```
lms/
  app/                       # Next.js App Router
    api/auth/                #   login, signup, logout route handlers (proxy to backend, set cookie)
    login/                   #   /login page
    signup/                  #   /signup page
    dashboard/               #   protected page (server-side auth check)
    page.tsx                 #   redirects to /dashboard or /login
    layout.tsx
  lib/
    api.ts                   #   API_URL, AUTH_COOKIE, Role types
    getCurrentUser.ts        #   server-side helper that calls /api/auth/me
  proxy.ts                   # Next.js 16 "proxy" (formerly middleware) — protects routes
  backend/
    src/
      config/                #   env loader, mongoose connect
      models/User.ts         #   schema, password hashing, comparePassword
      controllers/           #   auth controller (signup, login, logout, me)
      routes/                #   /api/auth/*
      middleware/            #   requireAuth, requireRole, errorHandler
      utils/                 #   JWT sign/verify, cookie helpers
      app.ts                 #   express app factory
      server.ts              #   entry point
```

## Auth flow

1. Browser POSTs credentials to **Next.js** `/api/auth/login` (same-origin).
2. The Next.js Route Handler forwards the request to **Express** `/api/auth/login`.
3. Express validates with Zod, looks up the user, compares the password with `bcrypt.compare`, and signs a JWT.
4. Express returns `{ user, token }`.
5. The Next.js Route Handler sets `lms_token` as an **HTTP-only cookie on the Next.js origin** (`:3000`).
6. On every navigation, `proxy.ts` checks the cookie and redirects unauthenticated requests to `/login` (with a `?next=` return path). Authenticated users hitting `/login` or `/signup` are redirected to `/dashboard`.
7. Protected pages additionally call `getCurrentUser()`, which forwards the cookie to Express `/api/auth/me` for real validation.

This double-check pattern matches the Next.js docs' "optimistic check in proxy + authoritative check in the page" recommendation.

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env       # then edit JWT_SECRET, MONGODB_URI
npm install
npm run dev                # runs on http://localhost:5001
```

Make sure MongoDB is running locally (or point `MONGODB_URI` at Atlas).

### 2. Frontend

In a second terminal, from the project root:

```bash
cp .env.local.example .env.local
npm install                # adds nothing new — existing deps already cover this
npm run dev                # runs on http://localhost:3000
```

Visit http://localhost:3000 — you'll be redirected to `/login`.

## Environment variables

**`backend/.env`**
| Var              | Default                                | Purpose                          |
|------------------|----------------------------------------|----------------------------------|
| `PORT`           | `5001`                                 | API port                         |
| `MONGODB_URI`    | `mongodb://127.0.0.1:27017/lms`        | Mongo connection string          |
| `JWT_SECRET`     | —                                      | **Required.** Long random string |
| `JWT_EXPIRES_IN` | `7d`                                   | Token lifetime                   |
| `COOKIE_NAME`    | `lms_token`                            | Cookie name                      |
| `CLIENT_ORIGIN`  | `http://localhost:3000`                | CORS allow-list                  |
| `NODE_ENV`       | `development`                          | Affects cookie flags             |

**`.env.local`** (Next.js)
| Var                   | Default                  |
|-----------------------|--------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001`  |
| `AUTH_COOKIE_NAME`    | `lms_token`              |

## API reference

| Method | Path                | Auth | Body                                  | Returns                      |
|--------|---------------------|------|---------------------------------------|------------------------------|
| POST   | `/api/auth/signup`  | —    | `{ name, email, password, role? }`    | `{ user, token }`            |
| POST   | `/api/auth/login`   | —    | `{ email, password }`                 | `{ user, token }`            |
| POST   | `/api/auth/logout`  | —    | —                                     | `{ message }`                |
| GET    | `/api/auth/me`      | ✓    | —                                     | `{ user }`                   |

Validation errors return 400 with `{ message, errors }`. Auth failures return 401. Duplicate emails return 409.