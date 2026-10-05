# Scratch

The social analytics companion for itch.io creators. Website: https://getscratch.app.

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

## App identity

The mobile app is Scratch (`app.getscratch`). Its OAuth callback is `scratch://oauth`; configure the same URL in the itch.io OAuth application and `API_OAUTH_ITCH_CALLBACK_URL`. Rebuild the native app after changing its identifiers.

The local database and role are `scratch`; Docker stores its data in `scratch_pg`. Device storage migrates to Scratch keys on first access. The itch.io integration remains in `libs/itch`; internal workspace packages use `@scratch/*`.
