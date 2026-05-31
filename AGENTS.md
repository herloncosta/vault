# AGENTS.md

## Project structure

```
vault/
├── api/              # Express 5 REST API (Postgres + Prisma v7)
├── client/           # Vite + React 19 + TypeScript 6 SPA
└── infra/            # ngrok docker-compose (tunnels client dev server)
```

## Commands

| Purpose | Directory | Command |
|---|---|---|
| API dev server | `api/` | `npm run dev` |
| Start Postgres | `api/` | `npm run db:up` |
| Apply schema | `api/` | `npm run db:push` |
| Create migration | `api/` | `npm run db:migrate` |
| Generate Prisma Client | `api/` | `npm run db:generate` |
| Open Prisma Studio | `api/` | `npm run db:studio` |
| Run seed | `api/` | `npm run db:seed` |
| Client dev server | `client/` | `npm run dev` |
| Build client | `client/` | `npm run build` |
| Format client | `client/` | `npm run format` |

## API gotchas

- **Prisma v7** — `datasource.url` goes in `prisma.config.js`, not in `schema.prisma`. `new PrismaClient()` without a driver adapter fails; use `PrismaPg` adapter with `connectionString` from env (see `src/config/database.js`).
- **Auth** — tokens delivered via httpOnly cookies (`accessToken`, `refreshToken`). The client reads them automatically via `credentials: "include"`. Refresh token rotation invalidates the old token on each use. Access token is also accepted as `Authorization: Bearer` header.
- **RBAC** — `ADMIN` and `OPERATOR` (default). `POST /api/users` requires `ADMIN`. OPERATOR can only access own data.
- **Logger** — uses `pino` + `pino-pretty` in dev, `winston` JSON in production (`NODE_ENV`).
- **Test requests** — `api/requests.http` works with VS Code REST Client.

## Actual API routes (not all documented in old routes table)

| Endpoint | Auth | Description |
|---|---|---|
| `GET /health` | No | Health check |
| `POST /api/auth/register` | No | Register |
| `POST /api/auth/login` | No | Login (httpOnly cookies) |
| `POST /api/auth/refresh` | No | Refresh tokens (httpOnly cookies) |
| `POST /api/auth/logout` | JWT | Revoke tokens |
| `GET /api/auth/me` | JWT | Current user |
| `PUT /api/auth/me` | JWT | Update own profile |
| `PATCH /api/auth/me/budget` | JWT | Update monthly budget |
| `GET /api/users` | JWT+ADMIN | List users |
| `GET /api/users/:id` | JWT+ADMIN | Get user |
| `POST /api/users` | JWT+ADMIN | Create user |
| `PUT /api/users/:id` | JWT+ADMIN | Update user |
| `DELETE /api/users/:id` | JWT+ADMIN | Delete user |
| `GET /api/transactions` | JWT | CRUD (paginated, filterable) |
| `GET /api/recurring-expenses` | JWT | CRUD (paginated) |
| `GET /api/installment-expenses` | JWT | CRUD + `PATCH /installments/:id/paid` |
| `GET /api-docs` | No | Swagger UI |

## Client conventions

- **Styling** — Tailwind CSS v4 via `@tailwindcss/vite` plugin. No CSS modules. Dark mode via `.dark` class on `<html>` toggled by `ThemeContext`.
- **Icons** — `lucide-react`.
- **Charts** — `recharts` (already installed).
- **API layer** — `src/lib/api.ts` handles all fetch calls, auto-refresh on 401, `credentials: "include"`. Do not use raw `fetch`.
- **Auth** — `AuthContext` provides `{ user, loading, login, logout, updateProfile, refreshUser }`.
- **TypeScript** — `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums, no namespaces), `noUnusedLocals`/`noUnusedParameters`.
- **Routing** — `react-router-dom` v7. Protected routes in `ProtectedLayout`. Pages route on `/*` under `/login`.
- **Modals** — use the existing `Modal` component (`src/components/modal.tsx`) which uses `createPortal`. Never inline overlay divs.

## Utils

- `src/lib/currency.ts` — `fmt()` (format to BRL string), `parse()` (BRL string to number), `toInput()` (number to BRL input string). Use these instead of `Intl.NumberFormat` directly.

## What's already built

All screens exist in `client/src/pages/`: login, home (dashboard), profile, settings, transactions, recurring-expenses, installment-expenses, admin-users. Do not create new top-level page files unless adding a new feature.

## infra/

`infra/docker-compose.yml` runs ngrok to expose the client dev server (port 5173). Requires `NGROK_AUTHTOKEN` in `infra/.env`.

## No tests

No test framework or test files exist in either `api/` or `client/`.
