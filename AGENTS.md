# itch — Agent Ruleset

Non-negotiable rules for ANY agent working in this repo. Read this file fully
before touching code. If a change would violate a rule here, stop and follow
the rule, not the shortcut.

---

## 1. File naming schema

All source files are kebab-case with the file's role separated by a dot:

- `auth.provider.tsx` — context provider
- `auth.screen.tsx`, `dashboard.screen.tsx` — screens
- `fullscreen-spinner.component.tsx` — shared components
- `itch.strategy.ts`, `itch.guard.ts` — backend
- `db.module.ts`, `db.inference.ts`, `users.service.ts`, `base.repository.ts`

Excluded from the dot rule (entry/config files): `App.tsx`, `main.ts`,
`*.config.*`, `*.json`, `tsconfig*`, `metro.config.js`.

## 2. REST API design (STRICT)

- Everything is a RESOURCE. Routes are nested under the owning resource:
  - `GET users/{user_id}/payments` — a user's payments (list)
  - `GET users/{user_id}/payments/{payment_id}` — single payment
  - `POST users/{user_id}/payments` — create (import) payments
  - `GET users/{user_id}/itch/profile` — external itch.io data of the user
- `me` is STRICTLY reserved for the auth endpoint that returns the decoded
  JWT (`GET /auth/me`). NEVER name anything else "me".
- **Controller = lowest level.** The `@Controller()` decorator is only the
  top-level segment (e.g. `@Controller('users')`); method decorators carry
  the rest (`@Get(':user_id/payments')`). NEVER nest resource paths inside
  `@Controller('users/:user_id/payments')` and NEVER create per-sub-resource
  controllers for the same top-level resource.
- One resource = one controller file. All `users/*` routes live in
  `users.controller.ts` (users, their payments, their itch sub-resources).
- List endpoints return BARE ARRAYS of the resource DTO
  (`PaymentDto[]`) — NO envelopes (`{items, total, limit, offset}`),
  NO wrapper objects. Pagination totals go in the `X-Total-Count`
  response header when needed.
- Computed/non-entity responses (aggregates, summaries) are isolated
  dedicated DTOs — rare, never as envelopes around entities.
- Do not invent endpoints nobody calls. Every endpoint must have a consumer
  (mobile app today). No speculative endpoints.

## 3. DTO = ENTITY, ALWAYS

- The wire DTO mirrors the database entity **field-for-field, 1:1, ALL
  columns** — including ones you personally find icky (PII like email, ip,
  billing). No cherry-picking columns, no `columns:` projections in
  drizzle queries to "clean up" the payload, no omissions.
- Drizzle `columns:` objects may only be used for internal optimizations
  where the result is never returned to a client.
- Column aliasing in queries is forbidden (drizzle typing breaks) — if the
  name differs, the DTO field name IS the entity field name.
- Dates are typed as `Date` in DTOs (serialized as ISO over the wire).
- NEVER write `toDto()`/mapping functions in controllers or services. Rows
  flow straight from repository → service → controller → wire.
- If a response genuinely needs a different shape than the entity, create an
  ISOLATED dedicated DTO (e.g. `PaymentsSummaryDto`). This is the exception,
  not the pattern.

## 4. Pagination

- Reusable `PaginationDto` (in `libs/protocol`) for ALL list endpoints:
  `limit` (1–100, default 20) and `offset` (≥ 0, default 0), validated via
  class-validator decorators.
- Controllers pass `pagination.limit` / `pagination.offset` DIRECTLY into
  the repository call. NO fallback values (`?? 20`) in controllers — the
  DTO owns defaults, minimums and maximums.
- Offset pagination (`limit`/`offset`), matching `BaseRepository.findMany`.
- Mobile detects the last page by page length (`length < PAGE_SIZE`), not
  by a total field.

## 5. Shared lib patterns (STRICT)

- Data access lives ONLY in `libs/shared` and follows the layered pattern:
  - `schemas/*.sql.ts` — drizzle table definitions
  - `types/*.types.ts` — `InferSelectModel`/`InferInsertModel` types
  - `repositories/*.repository.ts` — thin `BaseRepository` subclass
  - `services/*.service.ts` — thin `BaseService` subclass
  - `modules/*.module.ts` — wires repository + service, exports service
- Repositories and services are LEAN: only inherited calls (`find`,
  `findMany`, `create`, `update`, `delete`, `count`, `exists`). NO custom
  query methods, NO direct `database` injection in services, NO raw SQL in
  feature code, NO `onConflictDo...` outside the base layer.
- Feature-specific LOGIC (mapping, parsing, orchestration) lives in the
  domain lib (`libs/itch` etc.) and composes the shared services through
  their public methods.
- NEVER bypass the pattern by injecting `DATABASE_KEY` into feature
  services or controllers.
- Config values NEVER reach services through `ConfigService` directly.
  Services inject dedicated `Symbol()` keys (e.g. `TOKEN_ENC_KEY`,
  `JWT_SECRET_KEY`, `AUTH_CONFIG_KEY`, `DATABASE_URL_KEY`); only module-level
  providers touch `ConfigService` via `inject: [ConfigService]` +
  `getOrThrow` factories.

## 6. Auth & security

- `me` endpoint: auth-only (see §2).
- Route ownership: `users/:user_id/*` resources are guarded by
  `AuthGuard` + `UserOwnershipGuard` (owner or admin). Guards are applied
  per METHOD (controller-level guards would leak onto routes that don't
  have the `user_id` param).
- The itch.io access token is persisted server-side ENCRYPTED AT REST
  (AES-256-GCM in `TokenCipherService`, keyed by `API_TOKEN_SECRET`) in the
  `api_keys` table, linked to its `oauth_identities` row (one key per
  identity). It is written at login by the itch OAuth strategy and decrypted
  server-side only for itch.io API calls — never sent to clients in
  plaintext and never exposed through any DTO.
- Background syncs (e.g. `GamesSyncScheduler`) use the stored token; explicit
  per-request `x-itch-token` header (when present) always takes precedence.
- Sessions: JWT access/refresh cookie pair + Bearer support; the mobile
  client persists the pair in SecureStore (its cookie jar does not survive
  restarts) and rotates via `/auth/refresh` transparently on 401.
- itch.io OAuth = implicit flow only (`response_type=token`): no code
  exchange, no client secret. The passport strategy owns the flow; the
  app's `/auth/login` 302s to itch.io and itch redirects straight back to
  the app scheme (`itch-dashboard://oauth`).
- itch.io's payment-level revenue still comes from manual CSV sync
  (dashboard export-purchases) via the payments import endpoint. The
  `profile/games` sync does not deliver revenue/earnings values for OAuth
  tokens — the games table intentionally has no earnings column.

## 7. React Query on mobile (STRICT)

- ALL data fetching goes through React Query hooks in `src/api/queries.ts`
  (`useQuery`/`useInfiniteQuery`/`useMutation`). NEVER fetch in
  `useEffect`, NEVER `useState` + manual load functions.
- List pagination: `useInfiniteQuery` with offset page params.
- Mutations that change session state must persist state FIRST, then update
  the query cache (set/invalidate) — never invalidate in `onSuccess` before
  the session write completes (this caused the auth-screen race).
- Env vars are validated with zod at module import (`src/env.ts`) — same
  pattern as the API's `env.ts`. No `??` fallbacks for required vars.
- Wire types come EXCLUSIVELY from `libs/protocol` via type-only imports
  (`import type { PaymentDto } from '@itch/protocol'`, tsconfig paths
  alias + `experimentalDecorators`). NEVER mirror DTOs in local
  `src/api/types.ts` files, NEVER hand-type endpoint response shapes.

## 8. UI stack (mobile)

- HeroUI Native ONLY, granular imports (`heroui-native/button`,
  `heroui-native/card`, …) — a single barrel import from `heroui-native`
  breaks bundle-size optimization. NEVER mix raw RN styling that fights
  the tokens; theme colors come from CSS variables in `global.css`
  (single source of truth, shadcn-style). NO hardcoded brand hex in
  components — add a token instead.
- Button spinners via the `Button` wrapper's `isLoading` (spinner color
  derives from the variant's label token). Text must stay legible in ALL
  states (rest/press/disabled) — press highlight is token-tinted, not gray.
- Dark mode is a first-class theme (semantic tokens under `@variant dark`);
  never hardcode light/dark-specific colors in components.
- SVG assets are imported Vite-style from `apps/mobile/assets/*.svg` via
  `react-native-svg-transformer` (metro config). Self-colored variants
  (e.g. `-white`, `-red`) since transformed SVGs cannot be re-tinted.

## 9. General engineering

- Never leave debug logging (`[debug] ...`) in committed code.
- No speculative code: no unused endpoints, unused hooks, unused types,
  "maybe later" features, or dead exports. If it has no consumer, delete it.
- Comments are for non-obvious invariants only — not narrating the code.
- After ANY change: `tsc` (API + mobile), `biome check`, `nest build api`,
  and for mobile UI changes an `expo export --platform ios` smoke bundle.
  DB schema changes: regenerate migrations (`pnpm db:migrate`) and apply.
- New native modules require `npx expo prebuild -p ios --clean` +
  `pnpm mobile:ios` — announce it explicitly when a change forces a rebuild.
