import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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

export class OauthIdentityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;

  @ApiProperty({ format: 'uuid' })
  user_id!: string;

  @ApiProperty({ example: 'itch' })
  provider!: 'itch';

  @ApiProperty({ description: 'itch.io user id.' })
  provider_user_id!: string;

  @ApiProperty({ type: String, nullable: true })
  username!: string | null;

  @ApiProperty({ type: String, nullable: true })
  name!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'url' })
  avatar_url!: string | null;
}

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

  @ApiProperty({ type: String, nullable: true, example: 'stripe' })
  source!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'PL' })
  country_code!: string | null;

  @ApiProperty({ type: String, nullable: true })
  donation!: string | null;

  @ApiProperty({ type: String, nullable: true })
  on_sale!: string | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Unit price in cents.' })
  product_price_cents!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  tax_added_cents!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  tip_cents!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  marketplace_fee_cents!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  source_fee_cents!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'payout_pending' })
  payout!: string | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Net after fees in cents.' })
  amount_delivered_cents!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'USD' })
  currency!: string | null;

  @ApiProperty({ type: String, nullable: true })
  source_id!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'HMAC of the buyer email — the raw address is never stored.',
  })
  customer_key!: string | null;

  @ApiProperty({ type: Date, nullable: true, format: 'date-time' })
  purchased_at!: Date | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Gross amount in cents.' })
  amount_cents!: number | null;
}

export class PaymentSourceDto {
  @ApiProperty({ example: 'stripe' })
  source!: string;

  @ApiProperty({ example: 450000, description: 'Gross revenue via this provider, in cents.' })
  amount_cents!: number;
}

export class PaymentCountryDto {
  @ApiProperty({ example: 'US' })
  country_code!: string;

  @ApiProperty({ example: 12, description: 'Payments from this country.' })
  payments!: number;

  @ApiProperty({ example: 450000, description: 'Gross revenue from this country, in cents.' })
  revenue_cents!: number;
}

export class PaymentsSummaryDto {
  @ApiProperty({ description: 'Total imported payments.' })
  total!: number;

  @ApiProperty({ example: 500500, description: 'Gross revenue in USD cents.' })
  revenue_cents!: number;

  @ApiProperty({ description: 'Distinct buyers (from hashed emails).' })
  customers!: number;

  @ApiProperty({ description: 'Sum of tips in USD cents.' })
  tip_cents!: number;

  @ApiProperty({ type: [PaymentSourceDto] })
  sources!: PaymentSourceDto[];

  @ApiProperty({ type: [PaymentCountryDto] })
  countries!: PaymentCountryDto[];
}

export class PaymentGraphPointDto {
  @ApiProperty({ example: '2026-09-26' })
  date!: string;

  @ApiProperty({ description: 'Cumulative value at this date (cents or count).' })
  value!: number;
}

export class PaymentsGraphsDto {
  @ApiProperty({ type: [PaymentGraphPointDto], description: 'Cumulative gross revenue (cents).' })
  revenue!: PaymentGraphPointDto[];

  @ApiProperty({ type: [PaymentGraphPointDto], description: 'Cumulative payment count.' })
  payments!: PaymentGraphPointDto[];

  @ApiProperty({ type: [PaymentGraphPointDto], description: 'Cumulative distinct buyers.' })
  customers!: PaymentGraphPointDto[];

  @ApiProperty({ type: [PaymentGraphPointDto], description: 'Cumulative average payment (cents).' })
  average!: PaymentGraphPointDto[];

  @ApiProperty({ type: [PaymentGraphPointDto], description: 'Cumulative tip revenue (cents).' })
  tips!: PaymentGraphPointDto[];
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

export class PaymentsFilterDto {
  @ApiPropertyOptional({ description: 'Product name or purchase ID.' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  search?: string;
}
