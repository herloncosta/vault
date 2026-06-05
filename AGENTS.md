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
| API dev server (`--watch`) | `api/` | `npm run dev` |
| API production start | `api/` | `npm start` |
| Start Postgres | `api/` | `npm run db:up` |
| Stop Postgres | `api/` | `npm run db:down` |
| Apply schema | `api/` | `npm run db:push` |
| Create migration | `api/` | `npm run db:migrate` |
| Generate Prisma Client | `api/` | `npm run db:generate` |
| Open Prisma Studio | `api/` | `npm run db:studio` |
| Run seed | `api/` | `npm run db:seed` |
| Client dev server | `client/` | `npm run dev` |
| Build (tsc + vite) | `client/` | `npm run build` |
| Format via Prettier | `client/` | `npm run format` |
| ngrok tunnel | `infra/` | `docker compose up -d` |

## API gotchas

- **Prisma v7** — `datasource.url` goes in `prisma.config.js`, not in `schema.prisma`. `new PrismaClient()` without a driver adapter fails; use `PrismaPg` with `connectionString` from env (see `src/config/database.js`).
- **Auth** — tokens delivered via httpOnly cookies (`accessToken`, `refreshToken`). The client sends `credentials: "include"`. Refresh token rotation invalidates the old token on each use. Access token also accepted as `Authorization: Bearer` header.
- **RBAC** — `ADMIN` and `OPERATOR` (default). `POST /api/users` requires `ADMIN`. OPERATOR can only access own data.
- **Logger** — `pino` + `pino-pretty` in dev, `winston` JSON in production (checked via `NODE_ENV`).
- **Modules** — routes live in `src/modules/{auth,users,transactions,recurring-expenses,installment-expenses}/`.
- **Test requests** — `api/requests.http` works with VS Code REST Client.
- Full API reference at `README.md` and Swagger UI (`GET /api-docs`).

## Client conventions

- **Styling** — Tailwind CSS v4 via `@tailwindcss/vite` plugin. No CSS modules. Dark mode via `.dark` class on `<html>`, toggled by `ThemeContext` (persisted to localStorage key `theme`).
- **Prettier** — config at `client/.prettierrc` (double quotes, trailing commas, 100 print width).
- **Icons** — `lucide-react`.
- **Charts** — `recharts`.
- **API layer** — `src/lib/api.ts` handles all fetch calls, auto-refresh on 401, `credentials: "include"`. Never use raw `fetch`. Session expiry handler via `setOnUnauthorized`.
- **Auth** — `AuthContext` provides `{ user, loading, login, logout, updateProfile, refreshUser }`.
- **TypeScript** — `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums, no namespaces), `noUnusedLocals`/`noUnusedParameters`.
- **Routing** — `react-router-dom` v7. Pages are lazy-loaded. Public route at `/login`, all other routes under `/*` wrapped in `ProtectedLayout`. Admin-only route at `/admin/usuarios`.
- **Route paths are in Portuguese** — `/perfil`, `/configuracoes`, `/transacoes`, `/despesas-fixas`, `/despesas-parceladas`, `/admin/usuarios`.
- **Modals** — use `Modal` component from `src/components/modal.tsx` (uses `createPortal`). Never inline overlay divs.

## Utils

- `src/lib/currency.ts` — `fmt()` (BRL string), `parse()` (BRL string → number), `toInput()` (number → BRL input string). Use instead of `Intl.NumberFormat`.

## What's already built

All screens exist in `client/src/pages/`: login, home (dashboard), profile, settings, transactions, recurring-expenses, installment-expenses, admin-users. Do not create new top-level page files unless adding a new feature.

## infra/

`infra/docker-compose.yml` runs ngrok to expose the client dev server (port 5173). Requires `NGROK_AUTHTOKEN` in `infra/.env`. Vite config allows ngrok domain via `allowedHosts`.

## No tests

No test framework or test files exist in either `api/` or `client/`.
