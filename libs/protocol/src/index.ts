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
  @ApiProperty({ example: 8123 })
  total_views!: number;

  @ApiProperty({ example: 512 })
  total_downloads!: number;

  @ApiProperty({ example: 34.2 })
  conversion_rate!: number;

  @ApiProperty({ type: [MetricPointDto] })
  views_series!: MetricPointDto[];

  @ApiProperty({ type: [MetricPointDto] })
  downloads_series!: MetricPointDto[];
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

/** GET /itch/games — games the OAuth'd user develops. */
export class ItchGameDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, nullable: true, format: 'url' })
  url!: string | null;

  @ApiProperty({ type: String, nullable: true })
  title!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'url' })
  cover_url!: string | null;

  @ApiProperty({ type: String, nullable: true })
  published_at!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  views_count!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  downloads_count!: number | null;
}
