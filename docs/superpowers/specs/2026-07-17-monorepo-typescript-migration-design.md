# Monorepo + TypeScript Migration — Design Spec

**Date:** 2026-07-17
**Branch:** `develop`
**Status:** Approved by user

## Goal

Convert the Restaurante-app repository into a pnpm monorepo, migrate backend and frontend to TypeScript, and reorganize code by responsibility (backend: routes/controllers/services/middlewares/utils; frontend: domain features with components/hooks/utils). Behavior stays identical except for approved safe cleanup.

## Constraints and decisions

- **Strategy:** incremental, phase by phase. The app must run at the end of every phase. One PR per phase into `develop`.
- **Cleanup scope:** port behavior as-is, plus safe cleanup only — remove dead duplicate routes, delete committed backup files, move hardcoded secrets to env. No business-logic changes.
- **Frontend split:** by functional domain (orders, tables, kitchen, cash, reservations, saas, auth, ...), each with its own `components/`, `hooks/`, `utils/`. Global `components/hooks/utils` only for shared code.
- **Safety net:** API smoke tests (Vitest + Supertest) written BEFORE any restructuring, run against the local Docker Postgres.
- **Validation library:** **valibot** (not zod) — lighter, modular, tree-shakeable. Used for env validation in `config/` and request validation where the current code already validates.
- **Framework:** Express 5 stays. No framework change during migration.
- **TypeScript:** `strict: true` in all packages.

## Target structure

```
Restaurante-app/
├── pnpm-workspace.yaml
├── package.json              # root scripts: dev, build, test, lint
├── docs/
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── routes/        # endpoint definitions only, delegate to controllers
│   │       ├── controllers/   # request parsing, HTTP responses
│   │       ├── services/      # business logic + Prisma (only layer touching DB)
│   │       ├── middlewares/   # auth, permissions, central errorHandler
│   │       ├── utils/
│   │       ├── config/        # env validation with valibot, fails fast at boot
│   │       └── index.ts       # bootstrap only (~50 lines)
│   └── frontend/
│       └── src/
│           ├── features/
│           │   └── <domain>/  # orders, tables, kitchen, cash, reservations, saas, auth...
│           │       ├── components/
│           │       ├── hooks/
│           │       └── utils/
│           ├── components/    # shared UI
│           ├── hooks/         # shared hooks
│           ├── utils/
│           ├── lib/api.ts     # HTTP client, base URL from VITE_API_URL
│           └── App.tsx        # thin shell + navigation
└── packages/
    └── shared/                # shared API contract types (request/response shapes)
```

Backend layers are subdivided by domain: `auth`, `orders`, `tables`, `kitchen`, `cash`, `products`, `reservations`, `inventory`, `saas`, `whatsapp`.

## Phases

### Phase 1 — Safety net
- Vitest + Supertest integration smoke tests against critical endpoints: login, orders, tables, cash session.
- Tests run against Docker Postgres (`backend-postgres-1`, port 1372).
- Recreate `backend/.env` (currently missing): `DATABASE_URL=postgresql://dusk:dusk@localhost:1372/dusk` plus `JWT_SECRET`.
- Deliverable: green baseline on current untouched code.

### Phase 2 — pnpm monorepo scaffold
- Move `backend/` → `apps/backend/`, `frontend/` → `apps/frontend/` (git mv, history preserved).
- Add `pnpm-workspace.yaml`, root `package.json` with workspace scripts.
- Create empty `packages/shared` scaffold.
- No source-code changes. Smoke tests still green.

### Phase 3 — Backend to TypeScript
- `tsconfig.json` strict; `tsx` for dev, `tsc` for build.
- Migrate domain by domain out of `index.js` (2470 lines) into routes/controllers/services/middlewares.
- Safe cleanup within this phase:
  - Remove dead duplicate routes (second `POST /auth/login`, second `PATCH /saas/restaurants/:id/reset-password`).
  - `JWT_SECRET` moves from hardcoded string (duplicated in `auth.js` and `index.js`) to env via valibot-validated config.
  - Delete committed uploads binaries from git tracking; add `.gitignore` entry for `apps/backend/src/uploads/`.
- Smoke tests green after every domain migrated.

### Phase 4 — Frontend to TypeScript + domain split
- `App.jsx` (6444 lines) split into `features/<domain>/` per target structure.
- Delete dead backup files: `Appversion1.jsx`, `appbackud.jsx`.
- `API_URL` hardcoded to `localhost:3001` → `import.meta.env.VITE_API_URL` with `.env` files.
- API types imported from `packages/shared`.
- Manual verification of each main flow (login, orders, tables, kitchen, cash, SaaS panel).

## Cross-cutting

- **`packages/shared`:** API contract types shared by both apps. Backend response/request shapes defined once.
- **Lint/format:** ESLint + Prettier configured at workspace root, single config for all packages.
- **Commits:** conventional commits, one PR per phase into `develop`.

## Error handling

- Central Express error-handling middleware; controllers throw typed errors, middleware maps them to HTTP responses.
- Config validation fails at boot with a clear message listing missing env vars.

## Testing

- Phase 1 smoke tests are the regression gate for all later phases.
- Frontend verification is manual in this migration; component tests are out of scope (future iteration).

## Out of scope

- Business-logic changes or new features.
- Framework changes (NestJS, Fastify).
- Full test suites for frontend.
- Deep refactor of suspicious logic (future iteration).
