# itch

The analytics dashboard for itch.io creators.

## Layout

- `apps/api` — NestJS REST API (OpenAPI docs at `/docs`)
- `apps/mobile` — React Native (Expo) iOS + Android app
- `libs/protocol` — wire DTOs shared between the API and the mobile app
- `libs/auth` — itch.io OAuth (implicit flow) + JWT cookie sessions
- `libs/shared` — Postgres (drizzle) database infra + generic modules
- `libs/itch` — itch.io catalog/data integration

## Development

```sh
pnpm i
cp .env.example .env
pnpm dev
```

OpenAPI docs: http://localhost:8000/docs

## Database

```sh
pnpm db:migrate  # generate migrations from schemas
pnpm db:apply    # apply migrations
pnpm db:studio   # drizzle studio
```
