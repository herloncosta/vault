# Contributing to Vault

Thanks for your interest in contributing! This is a short guide to get you productive fast.

## Setup

```bash
# API
cd api
cp .env.example .env
npm install
npm run db:up
npm run db:push && npm run db:generate
npm run dev   # http://localhost:3000

# Client (another terminal)
cd client
npm install
npm run dev   # http://localhost:5173
```

## Workflow

1. Open an issue first for significant changes (features, refactors, security fixes).
2. Branch from `develop`: `git checkout -b feat/short-description`.
3. Keep diffs focused — one concern per pull request.
4. Run the relevant checks before pushing (see below).
5. Open a PR against `develop` using the PR template.

## Checks

```bash
cd api && npm test              # API unit tests
cd client && npm test           # client unit tests (Vitest)
cd client && npm run build      # type check + production build
cd client && npm run format     # Prettier formatting
```

CI runs all of the above on every PR.

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`), scoped when useful (`feat(api): ...`).
- **Client:** TypeScript strict (`verbatimModuleSyntax` — use `import type`), Tailwind v4 (no CSS modules), never use raw `fetch` (use `src/lib/api.ts`), currency via `src/lib/currency.ts`, modals via the shared `Modal` component.
- **API:** validate inputs with `zod`, enforce per-user scoping on every query, never log PII or financial data.
- **Security:** report vulnerabilities privately — open a minimal issue asking for contact, do not post exploits publicly.
