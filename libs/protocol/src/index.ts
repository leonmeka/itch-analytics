import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Wire DTOs shared between the NestJS API and the mobile app.
 *
 * Response DTOs mirror the underlying drizzle entities field-for-field (no
 * custom response shapes): controllers return entity rows straight through
 * and only declare these classes for their wire documentation. Custom shapes
 * exist only where there is no entity (computed aggregates, itch.io data).
 * Request payloads are class-validated by the API's global ValidationPipe;
 * request documentation comes from @nestjs/swagger.
 *
 * The mobile client consumes everything type-only (`import type`), so the
 * decorators never reach the client bundle.
 */

/* ── request DTOs (validated + documented) ─────────────────────────── */

export class MetricRangeDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsString()
  to?: string;
}

/* ── entity-backed response DTOs (mirrors of the drizzle entities) ── */

export class UserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date; // ISO string over the wire

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date; // ISO string over the wire

  @ApiProperty({ example: 'user' })
  role!: 'user' | 'admin';
}

/* ── computed responses (no entity exists) ─────────────────────────── */

export class HealthDto {
  @ApiProperty({ example: 'ok' })
  status!: string;
}

export class MetricPointDto {
  @ApiProperty({ example: '2026-10-02' })
  date!: string;

  @ApiProperty({ example: 1234 })
  value!: number;
}

export class MetricsOverviewDto {
  @ApiProperty({ type: [MetricPointDto] })
  views_series!: MetricPointDto[];

  @ApiProperty({ type: [MetricPointDto] })
  downloads_series!: MetricPointDto[];

  @ApiProperty({ type: [MetricPointDto] })
  purchases_series!: MetricPointDto[];
}

/** GET /itch/games — games the OAuth'd user develops. */
export class ItchGameDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true, format: 'url' })
  url!: string | null;

  @ApiProperty({ type: String, nullable: true })
  title!: string | null;

  @ApiProperty({ type: String, nullable: true })
  cover_url!: string | null;

  @ApiProperty({ type: String, nullable: true })
  published_at!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  views_count!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  downloads_count!: number | null;
}

/* ── external itch.io data (third-party, no entity) ────────────────── */

/** GET /itch/me */
export class ItchProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ type: String, nullable: true })
  display_name!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'url' })
  avatar_url!: string | null;
}

/** Revenue entry for one currency (amount in minor units, e.g. cents). */
export class ItchEarningDto {
  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 5047 })
  amount!: number;

  @ApiProperty({ example: '$50.47' })
  amount_formatted!: string;
}

/** GET /itch/games — full analytics payload per game. */
export class ItchGameAnalyticsDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true, format: 'url' })
  url!: string | null;

  @ApiProperty({ type: String, nullable: true })
  title!: string | null;

  @ApiProperty({ type: String, nullable: true })
  short_text!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'url' })
  cover_url!: string | null;

  @ApiProperty()
  published!: boolean;

  @ApiProperty({ type: String, nullable: true })
  published_at!: string | null;

  @ApiProperty({ type: String, nullable: true })
  created_at!: string | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Minimum price in cents.' })
  min_price!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  views_count!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  downloads_count!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  purchases_count!: number | null;

  @ApiProperty({ type: [ItchEarningDto] })
  earnings!: ItchEarningDto[];
}

/** GET /itch/credentials — diagnostics for the itch access token. */
export class ItchCredentialsDto {
  @ApiProperty({ enum: ['key', 'jwt', null] })
  type!: 'key' | 'jwt' | null;

  @ApiProperty({ type: [String] })
  scopes!: string[];

  @ApiProperty({ type: String, nullable: true })
  expires_at!: string | null;
}

/** GET /itch/games/:gameId/rewards — claimed rewards for a game. */
export class ItchClaimedRewardDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  shortcode!: string | null;

  @ApiProperty({ type: String, nullable: true })
  reward_id!: string | null;

  @ApiProperty({ type: String, nullable: true })
  reward_title!: string | null;

  @ApiProperty({ type: String, nullable: true })
  reward_type!: string | null;

  @ApiProperty({ type: String, nullable: true })
  claimed_at!: string | null;
}

export class ItchClaimedRewardsDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  per_page!: number;

  @ApiProperty({ description: 'Total claimed rewards across all pages.' })
  total_items!: number;

  @ApiProperty({ type: [ItchClaimedRewardDto] })
  rewards!: ItchClaimedRewardDto[];
}

/** GET/PUT/DELETE /me/itch-key — per-user itch.io API key configuration. */
export class ItchKeyStatusDto {
  @ApiProperty()
  configured!: boolean;
}

/** GET /me/payments — imported itch.io payment (dashboard CSV row). */
export class PaymentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true, description: 'Sub-product name.' })
  object_name!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '25.00' })
  amount!: string | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Gross amount in cents.' })
  amount_cents!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'USD' })
  currency!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'stripe' })
  source!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  purchased_at!: string | null;

  @ApiProperty({ type: String, nullable: true })
  donation!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'payout_pending' })
  payout!: string | null;
}

/** POST /me/payments/import */
export class PaymentsImportResultDto {
  @ApiProperty({ description: 'Rows detected in the CSV.' })
  total!: number;

  @ApiProperty({ description: 'Newly stored payments.' })
  imported!: number;

  @ApiProperty({ description: 'Rows updated with changed fields (e.g. payout state).' })
  updated!: number;

  @ApiProperty({ description: 'Rows already up to date (deduplicated).' })
  skipped!: number;
}
