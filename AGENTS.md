# AGENTS.md

## Project structure

```
/                             # Workspace root (empty, no git repo)
api/                          # Node.js API project
├── prisma/
│   └── schema.prisma         # PostgreSQL schema (Prisma v7)
├── prisma.config.js           # Prisma CLI config (v7 requires this)
├── src/
│   ├── server.js             # Entry point — connects DB, starts HTTP
│   ├── app.js                # Express app setup (helmet, cors, rate-limit)
│   ├── config/
│   │   ├── env.js            # Environment variable loader (dotenv)
│   │   ├── database.js       # PrismaClient singleton
│   │   └── swagger.js        # OpenAPI/Swagger config
│   ├── middleware/
│   │   ├── error-handler.js  # Global Express error handler
│   │   └── auth.js           # JWT Bearer token verification
│   ├── modules/              # Feature modules go here
│   │   ├── auth/             # Register, login, profile
│   │   └── users/            # User CRUD (all protected)
│   └── utils/
│       └── logger.js         # pino (dev) / winston (prod)
├── .env / .env.example
└── package.json
```

## Key facts

- **ES Modules** — `"type": "module"` in `package.json`. All imports use `import`/`export`.
- **File naming** — lowercase-with-hyphens (`error-handler.js`, not `error.handler.js` or `errorHandler.js`).
- **Prisma v7** — `prisma.config.js` at project root is required for all CLI commands. The `datasource.url` goes in `prisma.config.js`, **not** in `schema.prisma`.
- **Env vars** — loaded via `dotenv` in both `src/config/env.js` (runtime) and `prisma.config.js` (CLI). Both files import `"dotenv/config"`.
- **Config via env** — CORS origins, rate-limit window/max, and JWT settings are all configured through environment variables in `src/config/env.js`.
- **Logging** — dev (`NODE_ENV !== "production"`) uses `pino` + `pino-pretty`; production uses `winston` JSON. See `src/utils/logger.js`.

## Commands

| Purpose | Command |
|---|---|
| Dev server (with auto-restart) | `npm run dev` |
| Start production | `npm start` |
| Generate Prisma Client | `npm run db:generate` |
| Apply schema to DB | `npm run db:push` |
| Create migration | `npm run db:migrate` |
| Open Prisma Studio | `npm run db:studio` |
| Run seed | `npm run db:seed` |
| Start Postgres (Docker) | `npm run db:up` |
| Stop Postgres (Docker) | `npm run db:down` |

## API routes

| Endpoint | Auth | Description |
|---|---|---|
| `GET /health` | No | Health check |
| `POST /api/auth/register` | No | Register |
| `POST /api/auth/login` | No | Login (returns access + refresh tokens) |
| `POST /api/auth/refresh` | No | Refresh access token using refresh token |
| `POST /api/auth/logout` | JWT | Logout (revokes access + refresh tokens) |
| `GET /api/auth/me` | JWT | Current user profile |
| `GET /api/users` | JWT | List users |
| `GET /api/users/:id` | JWT | Get user |
| `POST /api/users` | JWT | Create user |
| `PUT /api/users/:id` | JWT | Update user |
| `DELETE /api/users/:id` | JWT | Delete user |
| `GET /api-docs` | No | Swagger UI |

## Gotchas

- **No DB running** — `npm run dev` / `npm start` will fail without a reachable PostgreSQL at `DATABASE_URL`. For schema-only work, use `prisma validate` or `prisma generate`.
- **Prisma v7** — Do not add `url` to the `datasource` block in `schema.prisma`. All connection config lives in `prisma.config.js`.
- **PrismaClient requires options** — `new PrismaClient()` fails in v7. Use a driver adapter with `datasourceUrl` from env config (see `src/config/database.js`). The "client" (JS/WASM) engine is used by default in v7.
- **`--watch` flag** — requires Node 18+. Uses built-in Node file watcher (no nodemon needed).
- **Token expiry** — short-lived access token (`JWT_EXPIRES_IN`, default `15m`) + long-lived refresh token (`JWT_REFRESH_EXPIRES_IN`, default `7d`). Refresh token rotation invalidates the previous token on each use.
- **Expired token cleanup** — `cleanupExpiredTokens()` runs every hour via `setInterval` in `server.js`.

## Security audit

Every auth action is logged to `access_logs` table:
- `REGISTER`, `LOGIN`, `LOGOUT`, `REFRESH_TOKEN`
- Records IP, user-agent, and user ID
- Token revocation stored in `revoked_tokens` table (checked on every request via `jti`)
- Refresh tokens stored hashed in `refresh_tokens` table (SHA-256)
- `server.js` periodic cleanup removes expired entries every hour

## Security stack (already wired in `app.js`)

- `helmet` — HTTP headers
- `cors` — origins via `CORS_ORIGIN` env (comma-separated, `*` = all)
- `express-rate-limit` — window/max via `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` env
- `argon2` — password hashing
- `jsonwebtoken` — JWT sign/verify (`auth` + `authorize` middleware in `src/middleware/auth.js`)
- `zod` — input validation

## RBAC

Two roles: `ADMIN` and `OPERATOR` (default on register).
- `ADMIN` — full access to all endpoints
- `OPERATOR` — can only access own data (reads own profile, updates own profile, deletes own account)
- `authorize(...roles)` middleware checks role after auth; `POST /api/users` requires `ADMIN`
