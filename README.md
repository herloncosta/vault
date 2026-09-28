<picture>
  <source media="(prefers-color-scheme: dark)" srcset="client/public/vault-logo.png">
  <img alt="Vault" src="client/public/vault-logo.png" width="180">
</picture>

**Vault** — personal finance manager for tracking transactions, recurring bills, installment expenses, categories, and monthly budgets.

[![Node.js >= 22](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express 5](https://img.shields.io/badge/express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL 16](https://img.shields.io/badge/postgresql-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma 7](https://img.shields.io/badge/prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/typescript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

## Features

- 💸 **Transactions** — create, edit, delete, filter by type, and paginate income/expenses
- 📊 **Dashboard** — monthly aggregates with month-over-month change, category pies, 7-month bar chart
- 🔁 **Recurring expenses** — fixed bills with day-of-month scheduling
- 💳 **Installment expenses** — credit-card / carnê purchases with auto-generated installments (integer-cents split, month-end clamped due dates)
- 🏷️ **Categories** — per-user income/expense categories, seeded with defaults on signup
- 🎯 **Monthly budget** — per-user limit with progress tracking
- 👥 **Roles** — `ADMIN` (user management) and `OPERATOR` (own data only)
- 🌙 **Dark mode** — persisted `.dark` class toggle

## Tech stack

| Layer    | Technologies                                                                 |
| -------- | ---------------------------------------------------------------------------- |
| API      | Express 5, Prisma 7, PostgreSQL 16, JWT (httpOnly cookies + Bearer), argon2, zod |
| Client   | React 19, TypeScript 6, react-router-dom 7, react-hook-form, recharts, lucide-react |
| Styling  | Tailwind CSS v4 (`@tailwindcss/vite`), dark mode via `.dark` class           |
| Infra    | Docker Compose (PostgreSQL), dotenv                                          |
| Tests    | `node --test` (API), Vitest (client)                                         |

## Prerequisites

- **Node.js** >= 22
- **Docker** (for PostgreSQL)
- **npm** (or compatible package manager)

## Quick start

```bash
# 1. Start PostgreSQL
cd api
cp .env.example .env   # adjust JWT_SECRET (min 32 chars) for non-local use
npm install
npm run db:up

# 2. Apply schema and generate the Prisma Client
npm run db:push && npm run db:generate

# 3. Seed sample data (optional)
npm run db:seed

# 4. Start the API (http://localhost:3000)
npm run dev
```

In another terminal:

```bash
cd client
npm install
npm run dev   # http://localhost:5173 (proxies /api/* to :3000)
```

Interactive API docs (Swagger UI): `http://localhost:3000/api-docs` while the API runs.
Raw request collection for REST Client (VS Code): [`api/requests.http`](api/requests.http).

## Configuration

All API settings come from `api/.env` (see [`api/.env.example`](api/.env.example)):

| Variable                 | Default                 | Description                              |
| ------------------------ | ----------------------- | ---------------------------------------- |
| `DATABASE_URL`           | — (required)            | PostgreSQL connection string             |
| `PORT`                   | `3000`                  | API listen port                          |
| `HOST`                   | `0.0.0.0`               | API bind address (LAN access)            |
| `JWT_SECRET`             | — (required, ≥32 chars) | Signing key for access/refresh tokens    |
| `JWT_EXPIRES_IN`         | `15m`                   | Access token lifetime                    |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                    | Refresh token lifetime                   |
| `CORS_ORIGIN`            | `http://localhost:5173` | Allowed origins (`*` = reflect request origin) |
| `RATE_LIMIT_WINDOW_MS`   | `900000`                | Anonymous rate-limit window              |
| `RATE_LIMIT_MAX`         | `100`                   | Max anonymous requests per window        |

## Scripts

**API** (`api/`):

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Dev server with file watching (`--watch`) |
| `npm start`          | Production start                         |
| `npm test`           | Run unit tests (`node --test`)           |
| `npm run db:up`      | Start PostgreSQL via Docker              |
| `npm run db:down`    | Stop PostgreSQL                          |
| `npm run db:push`    | Push Prisma schema to the DB             |
| `npm run db:migrate` | Create a new migration                   |
| `npm run db:generate`| Generate Prisma Client                   |
| `npm run db:studio`  | Open Prisma Studio (GUI)                 |
| `npm run db:seed`    | Seed sample data                         |

**Client** (`client/`):

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Vite dev server (`--host`)     |
| `npm run build`   | Type check (`tsc -b`) + build  |
| `npm run preview` | Preview the production build   |
| `npm test`        | Run unit tests (Vitest)        |
| `npm run format`  | Format sources with Prettier   |

## API reference

Authenticated endpoints accept the access token via `Authorization: Bearer` header **or** the `accessToken` httpOnly cookie. Refresh-token rotation invalidates the previous token on each use.

| Method   | Endpoint                                              | Auth        | Description                              |
| -------- | ----------------------------------------------------- | ----------- | ---------------------------------------- |
| `GET`    | `/health`                                             | —           | Health check                             |
| `POST`   | `/api/auth/register`                                  | —           | Create account (+ default categories)    |
| `POST`   | `/api/auth/login`                                     | —           | Login (sets httpOnly cookies)            |
| `POST`   | `/api/auth/refresh`                                   | —           | Rotate tokens                            |
| `POST`   | `/api/auth/logout`                                    | JWT         | Revoke session tokens                    |
| `GET`    | `/api/auth/me`                                        | JWT         | Current user                             |
| `PUT`    | `/api/auth/me`                                        | JWT         | Update profile                           |
| `DELETE` | `/api/auth/me`                                        | JWT         | Delete own account                       |
| `PATCH`  | `/api/auth/me/budget`                                 | JWT         | Update monthly budget                    |
| `GET`    | `/api/transactions`                                   | JWT         | List (paginated, filterable)             |
| `GET`    | `/api/transactions/summary?month=YYYY-MM`             | JWT         | Monthly aggregates (current + previous)  |
| `GET`    | `/api/transactions/:id`                               | JWT         | Get one                                  |
| `POST`   | `/api/transactions`                                   | JWT         | Create                                   |
| `PUT`    | `/api/transactions/:id`                               | JWT         | Update                                   |
| `DELETE` | `/api/transactions/:id`                               | JWT         | Delete                                   |
| `GET`    | `/api/recurring-expenses`                             | JWT         | List (paginated)                         |
| `GET`    | `/api/recurring-expenses/:id`                         | JWT         | Get one                                  |
| `POST`   | `/api/recurring-expenses`                             | JWT         | Create                                   |
| `PUT`    | `/api/recurring-expenses/:id`                         | JWT         | Update                                   |
| `DELETE` | `/api/recurring-expenses/:id`                         | JWT         | Delete                                   |
| `GET`    | `/api/installment-expenses`                           | JWT         | List (paginated, nested installments)    |
| `GET`    | `/api/installment-expenses/:id`                       | JWT         | Get one                                  |
| `POST`   | `/api/installment-expenses`                           | JWT         | Create with auto-generated installments  |
| `PUT`    | `/api/installment-expenses/:id`                       | JWT         | Update metadata (totals are immutable)   |
| `DELETE` | `/api/installment-expenses/:id`                       | JWT         | Delete + cascade installments            |
| `PATCH`  | `/api/installment-expenses/installments/:id/paid`     | JWT         | Mark installment paid/unpaid             |
| `GET`    | `/api/categories`                                     | JWT         | List own categories (`?type=INCOME\|EXPENSE`) |
| `GET`    | `/api/categories/:id`                                 | JWT         | Get one                                  |
| `POST`   | `/api/categories`                                     | JWT         | Create                                   |
| `PUT`    | `/api/categories/:id`                                 | JWT         | Rename                                   |
| `DELETE` | `/api/categories/:id`                                 | JWT         | Delete                                   |
| `GET`    | `/api/users`                                          | JWT + ADMIN | List all users                           |
| `GET`    | `/api/users/:id`                                      | JWT + ADMIN | Get one                                  |
| `POST`   | `/api/users`                                          | JWT + ADMIN | Create user                              |
| `PUT`    | `/api/users/:id`                                      | JWT + ADMIN | Update user                              |
| `DELETE` | `/api/users/:id`                                      | JWT + ADMIN | Delete user                              |
| `GET`    | `/api-docs`                                           | —           | Swagger UI                               |

## Project structure

```
vault/
├── api/                    # Express 5 REST API
│   ├── prisma/             # Schema, seed, migrations
│   ├── requests.http       # REST Client collection
│   ├── src/
│   │   ├── config/         # env, database (PrismaPg), logger, swagger
│   │   ├── middleware/     # auth, error handler
│   │   └── modules/        # auth, users, transactions, categories,
│   │                       # recurring-expenses, installment-expenses
│   └── test/               # node:test unit tests
└── client/                 # React 19 SPA (Vite + Tailwind v4)
    └── src/
        ├── components/     # Forms, modal, layout primitives
        ├── contexts/       # AuthContext, ThemeContext
        ├── lib/            # api.ts (fetch + auto-refresh), currency.ts
        └── pages/          # login, home, transactions, recurring-,
                            # installment-expenses, profile, settings, admin-users
```

## Testing

```bash
cd api && npm test       # node:test suites (e.g. installment generation)
cd client && npm test    # Vitest suites (e.g. currency helpers)
```

## Security

- Passwords hashed with **argon2**; all sessions revoked on password change
- Short-lived access tokens (15 min) + rotating refresh tokens (7 days, `jti` revocation checked per request)
- Auth cookies are httpOnly; client auto-refreshes on 401 via `credentials: "include"`
- Strict rate limiting on anonymous auth routes; authenticated traffic scoped per route
- `helmet` headers, CORS allowlist, `trust proxy` for correct client IPs
- `zod` `.strip()` validation on inputs; Prisma unique violations mapped to `409 Conflict`
- Category ownership enforced on every financial write (IDOR prevention)
- Auth events logged to an `access_logs` table (no financial data or PII in logs)

## Contributing

Issues and pull requests are welcome. Please open an issue first to discuss significant changes, keep diffs focused, and run the relevant test suite (`npm test` in `api/` and/or `client/`) before submitting.

## License

MIT
