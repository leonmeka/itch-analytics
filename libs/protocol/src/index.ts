import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

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

export class UserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;

  @ApiProperty({ example: 'user' })
  role!: 'user' | 'admin';
}

export class HealthDto {
  @ApiProperty({ example: 'ok' })
  status!: string;
}

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

/** POST /auth/token response — our session pair plus the provisioning user. */
export class AuthTokenResponseDto {
  @ApiProperty({ format: 'url' })
  redirect_url!: string;

  @ApiProperty({ type: UserDto })
  user!: UserDto;

  @ApiProperty()
  access_token!: string;

  @ApiProperty()
  refresh_token!: string;
}

/** Imported itch.io payment — mirrors the payments entity field-for-field. */
export class PaymentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;

  @ApiProperty({ format: 'uuid' })
  user_id!: string;

  @ApiProperty({ description: 'itch.io purchase id.' })
  external_id!: string;

  @ApiProperty({ type: String, nullable: true, description: 'Sub-product name.' })
  object_name!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '25.00' })
  amount!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'stripe' })
  source!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '2026-08-23 19:45:22 UTC' })
  created_at_csv!: string | null;

  @ApiProperty({ type: String, nullable: true })
  email!: string | null;

  @ApiProperty({ type: String, nullable: true })
  full_name!: string | null;

  @ApiProperty({ type: String, nullable: true })
  donation!: string | null;

  @ApiProperty({ type: String, nullable: true })
  on_sale!: string | null;

  @ApiProperty({ type: String, nullable: true })
  country_code!: string | null;

  @ApiProperty({ type: String, nullable: true })
  ip!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Unit price in cents.' })
  product_price!: string | null;

  @ApiProperty({ type: String, nullable: true })
  tax_added!: string | null;

  @ApiProperty({ type: String, nullable: true })
  tip!: string | null;

  @ApiProperty({ type: String, nullable: true })
  marketplace_fee!: string | null;

  @ApiProperty({ type: String, nullable: true })
  source_fee!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'payout_pending' })
  payout!: string | null;

  @ApiProperty({ type: String, nullable: true })
  amount_delivered!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'USD' })
  currency!: string | null;

  @ApiProperty({ type: String, nullable: true })
  source_id!: string | null;

  @ApiProperty({ type: String, nullable: true })
  billing_name!: string | null;

  @ApiProperty({ type: String, nullable: true })
  billing_street_1!: string | null;

  @ApiProperty({ type: String, nullable: true })
  billing_street_2!: string | null;

  @ApiProperty({ type: String, nullable: true })
  billing_city!: string | null;

  @ApiProperty({ type: String, nullable: true })
  billing_state!: string | null;

  @ApiProperty({ type: String, nullable: true })
  billing_zip!: string | null;

  @ApiProperty({ type: String, nullable: true })
  billing_country!: string | null;

  @ApiProperty({ type: Date, nullable: true, format: 'date-time' })
  purchased_at!: Date | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Gross amount in cents.' })
  amount_cents!: number | null;
}

/** Gross revenue grouped per currency (headline aggregate). */
export class PaymentRevenueDto {
  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 500500, description: 'Gross amount in cents.' })
  amount_cents!: number;
}

/**
 * Isolated computed resource (not an entity mirror): overview metrics of a
 * user's imported payments.
 */
export class PaymentsSummaryDto {
  @ApiProperty({ description: 'Total imported payments.' })
  total!: number;

  @ApiProperty({ type: [PaymentRevenueDto] })
  revenue!: PaymentRevenueDto[];
}

export class PaginationDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
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
