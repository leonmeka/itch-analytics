# itch

The analytics dashboard for itch.io creators.

## Layout

- `apps/api` — NestJS REST API (OpenAPI docs at `/docs`)
- `apps/mobile` — React Native (Expo) iOS + Android app
- `libs/protocol` — wire DTOs shared between the API and the mobile app
- `libs/auth` — itch.io OAuth (implicit flow) + JWT token sessions
- `libs/shared` — Postgres (drizzle) database infra + generic modules
- `libs/itch` — itch.io API integration + payments CSV importer

## Development

```sh
pnpm i
cp .env.example .env
pnpm dev        # docker compose: postgres + api (applies migrations)
```

OpenAPI docs: http://localhost:8000/docs

Mobile (simulator or device):

```sh
pnpm mobile:ios     # build + run the iOS dev client (auto-prebuilds)
pnpm mobile         # Metro for fast JS iteration
```

## Database

```sh
pnpm db:migrate  # generate migrations from schemas
pnpm db:apply    # apply migrations
pnpm db:studio   # drizzle studio
```
