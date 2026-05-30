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
│   ├── modules/              # Feature modules
│   │   ├── auth/             # Register, login, profile
│   │   └── users/            # User CRUD (all protected)
│   └── utils/
│       └── logger.js         # pino (dev) / winston (prod)
├── .env / .env.example
├── docker-compose.yml
└── package.json
client/                       # Vite + React + TypeScript frontend
├── src/
│   ├── app.tsx               # Router + providers
│   ├── main.tsx              # Entry point
│   ├── index.css             # Tailwind import
│   ├── components/           # Reusable UI components
│   │   └── navbar.tsx        # Responsive navbar (hamburger on mobile)
│   ├── contexts/
│   │   └── auth-context.tsx   # Auth state (user, login, logout)
│   ├── lib/
│   │   └── api.ts            # Fetch wrapper (credentials: include for cookies)
│   └── pages/
│       ├── login.tsx          # Login form
│       ├── home.tsx           # Home page
│       └── profile.tsx        # User profile display
├── .prettierrc
├── vite.config.ts             # Proxy /api → localhost:3000
└── package.json
```

## Key facts

- **ES Modules** — `"type": "module"` in `package.json`. All imports use `import`/`export`.
- **File naming** — lowercase-with-hyphens (`error-handler.js`, not `error.handler.js` or `errorHandler.js`).
- **Prisma v7** — `prisma.config.js` at project root is required for all CLI commands. The `datasource.url` goes in `prisma.config.js`, **not** in `schema.prisma`.
- **Env vars** — loaded via `dotenv` in both `src/config/env.js` (runtime) and `prisma.config.js` (CLI). Both files import `"dotenv/config"`.
- **Config via env** — CORS origins, rate-limit window/max, and JWT settings are all configured through environment variables in `src/config/env.js`.
- **Logging** — dev (`NODE_ENV !== "production"`) uses `pino` + `pino-pretty`; production uses `winston` JSON. See `src/utils/logger.js`.

## Frontend conventions

- **Icons** — use `lucide-react` (already installed).
- **Styling** — Tailwind CSS v4 (all utility classes, no CSS modules).
- **Auth** — `AuthContext` in `contexts/auth-context.tsx` provides `{ user, login, logout }`. API calls use `credentials: "include"` for httpOnly cookies.
- **API requests** — use `src/lib/api.ts` wrapper (base fetch with cookies, JSON parsing, error throwing).
- **Routing** — `react-router-dom` with `BrowserRouter`. Protected routes redirect to `/login` if unauthenticated.
- **Responsive** — navbar uses `md:` breakpoints; mobile gets a hamburger toggle (`Menu`/`X` icons).
- **Formatting** — Prettier (`npm run format`). No ESLint.
- **Mobile menu** — slides from right to left (`translate-x-full` → `translate-x-0`) with `duration-300 transition-transform`, has backdrop overlay (`bg-black/40`).
- **Theme** — dark mode via `.dark` class toggled by `ThemeContext` in `contexts/theme-context.tsx`. All components must use `dark:` variants.
- **Transition default** — `transition-all duration-300` on interactive elements.
- **Component states** — every interactive element must handle `hover:`, `focus:`, `active:`, and `disabled:` visual states.

## Design guidelines

### Style

- **Aesthetic** — modern, minimalist, premium fintech. Clean whitespace, soft rounded corners (`rounded-2xl`/`rounded-3xl`), subtle glassmorphism (`backdrop-blur` with `bg-white/10` or `bg-black/10`).
- **Shadows** — use `shadow-lg` / `shadow-xl` for elevated elements (cards, modals, dropdowns).
- **Dark mode** — `.dark` class on `<html>`. Default background `gray-950`, cards `gray-900`, borders `gray-800`.

### Color palette

| Token | Light | Dark | Usage |
|---|---|---|---|
| Background | `slate-50` / `white` | `gray-950` | Page background |
| Surface | `white` | `gray-900` | Cards, modals, dropdowns |
| Border | `slate-200` | `gray-800` | Borders, dividers |
| Text primary | `slate-900` | `gray-100` | Headings, body |
| Text secondary | `slate-500` | `gray-400` | Labels, captions |
| Accent / Primary | `blue-600` | `blue-500` | Buttons, links, active nav |
| Positive / Income | `emerald-500` | `emerald-400` | Saldo positivo, receitas, entradas |
| Negative / Expense | `red-400` | `red-400` | Saídas, alertas, despesas |
| Investment | `violet-500` | `violet-400` | Investimentos, destaques UI |
| Warning | `amber-500` | `amber-400` | Limite próximo, alertas |

### Border radius — page-level pattern

All page-level containers (cards, sections, modals) must use `rounded-lg`. All interactive elements (buttons, inputs, icon wrappers, skeleton loaders, list items, pagination) must use `rounded-md`. Exception: avatar/badge chips may use `rounded-full`. This ensures a consistent, modern look across every screen.

### Responsiveness

- **Mobile-first** — all components start from mobile layout and scale up via `md:`, `lg:` breakpoints.
- **Fluid transitions** — use Tailwind responsive prefixes; no fixed widths.

## Screens & components to build

### Dashboard principal

- **Total balance card** — prominent, with subtle gradient or glass effect (`backdrop-blur`), using `emerald`/`blue` tones.
- **Monthly summary** — grid of 3 cards: Income (emerald), Expenses (red), Investments (violet), each with an icon and formatted value.
- **Quick actions** — floating button grid or row (Add Expense, Add Income, Transfer), using lucide icons.
- **Recent transactions** — scrollable list with category icons (lucide) and colored status badges.
- **Monthly spending limit widget** — progress bar (Tailwind) that shifts `emerald` → `amber` → `red` as limit approaches.

### Extrato & gestão de transações

- **Search bar** — integrated with quick filters (Category, Date, Status, Payment method). Controlled via `useState`.
- **Transaction list/table** — responsive rows with visual indicators for income/expense, category icon, amount, date.
- **Pagination** or **infinite scroll** with **skeleton screen** loading state (animated pulse divs).

### Orçamentos & metas

- **Budget categories grid** — each with a dynamic progress bar (Tailwind `bg-emerald-500` → `bg-amber-500` → `bg-red-500` based on percentage).
- **Long-term goals section** — interactive cards showing percentage complete, target value, and remaining amount. Categories: Emergency Fund, Travel, etc.

### Analytics

- **Chart placeholders** — structured layout with reserved areas for Pie chart (expense distribution) and Line chart (net worth over time).
- **Smart insights cards** — behavioral finance alerts ("Your delivery spending increased 12% this week") with lucide icon + colored background.

## Technical code requirements

- All components: functional React, clean, semantic, modular.
- Tailwind classes: organized by layout → spacing → color → typography → effects.
- Interactive elements: include `hover:`, `focus:`, `active:`, `disabled:` with `transition-all duration-300`.
- Simulated state management using `useState` for modals, tab switching, dropdowns, skeleton loading.
- No external CSS modules — all styling via Tailwind utilities.

## Commands

| Purpose | Directory | Command |
|---|---|---|
| Dev server (API) | `api/` | `npm run dev` |
| Start production (API) | `api/` | `npm start` |
| Generate Prisma Client | `api/` | `npm run db:generate` |
| Apply schema to DB | `api/` | `npm run db:push` |
| Create migration | `api/` | `npm run db:migrate` |
| Open Prisma Studio | `api/` | `npm run db:studio` |
| Run seed | `api/` | `npm run db:seed` |
| Start Postgres | `api/` | `npm run db:up` |
| Stop Postgres | `api/` | `npm run db:down` |
| Dev server (client) | `client/` | `npm run dev` |
| Build client | `client/` | `npm run build` |
| Format code | `client/` | `npm run format` |

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
