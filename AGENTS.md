# itch

Analytics dashboard for itch.io games — NestJS API + Expo (React Native) mobile app.

## File naming schema

All source files use kebab-case; a file's use case is separated with a dot, so the
file type/role is always visible from the name:

- `auth.provider.tsx` — context provider
- `auth.screen.tsx`, `dashboard.screen.tsx` — screens
- `fullscreen-spinner.component.tsx` — shared components
- Backend mirrors it: `itch.strategy.ts`, `itch.guard.ts`, `workers.controller.ts`,
  `db.module.ts`, `db.inference.ts`, `users.service.ts`, `base.repository.ts`

Excluded from the dot rule (entry/config files): `App.tsx`, `main.ts`, `*.config.*`,
`*.json`, `tsconfig*`, `metro.config.js`.

## Mobile apps structure

- `App.tsx` — routes (signed-out → `auth.screen`, signed-in → `dashboard.screen`)
- `src/api/` — API client, wire types, react-query hooks
- `src/providers/` — context providers
- `src/screens/` — screens
- `src/components/` — shared components

React Query (`@tanstack/react-query`) is the FE data layer — never fetch in
`useEffect`; add hooks in `src/api/queries.ts` (`useQuery`/`useMutation`).

## Backend structure

pnpm workspace: `apps/api` (Nest app), `libs/{protocol,shared,auth,itch}`.
- `libs/protocol` — wire DTOs for the API ↔ mobile contract
- `libs/shared` — Postgres (drizzle) infra + generic modules
- `libs/auth` — itch.io OAuth (implicit flow) + JWT cookie sessions;
  itch.io is the only auth provider on purpose
- `libs/itch` — itch.io API client (OAuth access token as bearer, never persisted)

## Development

```sh
pnpm i
cp .env.example .env
pnpm dev          # docker compose: postgres + api (auto-applies migrations)
```

API: http://localhost:8000 — OpenAPI docs at `/docs`.

Mobile (simulator):

```sh
pnpm mobile:ios   # first run: auto-prebuild + build dev client; connects to Metro
pnpm mobile       # Metro only (fast JS iteration afterwards)
```

`EXPO_PUBLIC_*` env values are read from the root `.env` (inlined into the
bundle by `dotenv-cli` prefixed scripts — see root `package.json`).

## Database

```sh
pnpm db:migrate  # generate migrations from schemas
pnpm db:apply    # apply migrations
pnpm db:studio   # drizzle studio
```
