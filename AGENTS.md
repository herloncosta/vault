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
│   │   └── database.js       # PrismaClient singleton
│   ├── middleware/
│   │   ├── error-handler.js  # Global Express error handler
│   │   └── auth.js           # JWT Bearer token verification
│   ├── modules/              # Feature modules go here
│   └── utils/                # Shared utilities
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

## Gotchas

- **No DB running** — `npm run dev` / `npm start` will fail without a reachable PostgreSQL at `DATABASE_URL`. For schema-only work, use `prisma validate` or `prisma generate`.
- **Prisma v7** — Do not add `url` to the `datasource` block in `schema.prisma`. All connection config lives in `prisma.config.js`.
- **PrismaClient requires options** — `new PrismaClient()` fails in v7. Use a driver adapter with `datasourceUrl` from env config (see `src/config/database.js`). The "client" (JS/WASM) engine is used by default in v7.
- **`--watch` flag** — requires Node 18+. Uses built-in Node file watcher (no nodemon needed).

## Security stack (already wired in `app.js`)

- `helmet` — HTTP headers
- `cors` — origins via `CORS_ORIGIN` env (comma-separated, `*` = all)
- `express-rate-limit` — window/max via `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` env
- `argon2` — password hashing (available, not wired)
- `jsonwebtoken` — JWT sign/verify (available, `auth` middleware ready)
- `zod` — input validation (available, not wired)
