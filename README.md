<picture>
  <source media="(prefers-color-scheme: dark)" srcset="client/public/vault-logo.png">
  <img alt="Vault" src="client/public/vault-logo.png" width="180">
</picture>

**Vault** — modern personal finance management application for tracking transactions, recurring bills, installment expenses, and monthly budgets.

## Architecture

```
vault/
├── api/          Express 5 REST API  →  PostgreSQL (Prisma 7 ORM)
├── client/       React 19 SPA        →  Vite + Tailwind CSS v4
```

## Tech stack

| Layer | Technologies |
|---|---|
| **API** | Express 5, Prisma 7, PostgreSQL 16, JWT (jsonwebtoken + httpOnly cookies), argon2, zod |
| **Client** | React 19, TypeScript 6, react-router-dom 7, recharts, lucide-react |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`), dark mode via `.dark` class |
| **Infra** | Docker (PostgreSQL), dotenv |

## Prerequisites

- **Node.js** >= 22 (uses `--watch` flag for dev)
- **Docker** (for PostgreSQL)

## Quick start

```bash
# 1. Start PostgreSQL
cd api && npm run db:up

# 2. Apply schema and generate client
npm run db:push && npm run db:generate

# 3. Seed sample data (optional)
npm run db:seed

# 4. Start API dev server (port 3000)
npm run dev
```

In another terminal:

```bash
cd client && npm install && npm run dev
```

Open `http://localhost:5173`. The client proxies `/api/*` to port 3000.

## Commands

### API (`api/`)

| Command | Description |
|---|---|
| `npm run dev` | Dev server with file watching |
| `npm start` | Production start |
| `npm run db:up` | Start PostgreSQL via Docker |
| `npm run db:down` | Stop PostgreSQL |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:migrate` | Create a new migration |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Open Prisma Studio (GUI) |
| `npm run db:seed` | Run seed script |

### Client (`client/`)

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server (`--host`) |
| `npm run build` | TypeScript check + Vite build |
| `npm run format` | Prettier formatting |

### Tunnel (`infra/`)

```bash
docker compose up -d
```

Requires `NGROK_AUTHTOKEN` in `infra/.env`. Exposes port 5173 to the internet.

## API overview

All authenticated endpoints accept the access token via `Authorization: Bearer` header **or** an `accessToken` httpOnly cookie. Refresh token rotation invalidates the previous token on each use.

| Endpoint | Auth | Description |
|---|---|---|
| `GET /health` | — | Health check |
| `POST /api/auth/register` | — | Create account |
| `POST /api/auth/login` | — | Login (sets httpOnly cookies) |
| `POST /api/auth/refresh` | — | Rotate tokens |
| `POST /api/auth/logout` | JWT | Revoke all tokens |
| `GET /api/auth/me` | JWT | Current user |
| `PUT /api/auth/me` | JWT | Update profile |
| `PATCH /api/auth/me/budget` | JWT | Update monthly budget |
| `GET /api/transactions` | JWT | List (paginated, filterable) |
| `POST /api/transactions` | JWT | Create |
| `PUT /api/transactions/:id` | JWT | Update |
| `DELETE /api/transactions/:id` | JWT | Delete |
| `GET /api/recurring-expenses` | JWT | List (paginated) |
| `POST /api/recurring-expenses` | JWT | Create |
| `PUT /api/recurring-expenses/:id` | JWT | Update |
| `DELETE /api/recurring-expenses/:id` | JWT | Delete |
| `GET /api/installment-expenses` | JWT | List (paginated, nested installments) |
| `POST /api/installment-expenses` | JWT | Create with auto-generated installments |
| `PUT /api/installment-expenses/:id` | JWT | Update metadata |
| `DELETE /api/installment-expenses/:id` | JWT | Delete + cascade installments |
| `PATCH /api/.../installments/:id/paid` | JWT | Mark installment paid/unpaid |
| `GET /api/users` | JWT+ADMIN | List all users |
| `POST /api/users` | JWT+ADMIN | Create user |
| `PUT /api/users/:id` | JWT+ADMIN | Update user |
| `DELETE /api/users/:id` | JWT+ADMIN | Delete user |
| `GET /api-docs` | — | Swagger UI |

Full interactive documentation at `http://localhost:3000/api-docs` when the API is running.

## Testing requests

Import `api/requests.http` into VS Code (REST Client extension) for quick endpoint testing. Variables are preconfigured at the top of the file.

## Security

- Passwords hashed with **argon2**
- Access tokens are short-lived (default 15 min), refresh tokens are long-lived (7 days) with rotation
- Revoked tokens are checked on every request via `jti`
- All auth events (login, logout, refresh, register) are logged to an `access_logs` table
- CORS, Helmet, and rate limiting configured in `app.js`

## License

MIT
