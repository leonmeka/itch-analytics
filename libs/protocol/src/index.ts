import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

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

export class PaymentRevenueDto {
  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 500500, description: 'Gross amount in cents.' })
  amount_cents!: number;
}

export class PaymentsSummaryDto {
  @ApiProperty({ description: 'Total imported payments.' })
  total!: number;

  @ApiProperty({ type: [PaymentRevenueDto] })
  revenue!: PaymentRevenueDto[];
}

export class PaymentGraphPointDto {
  @ApiProperty({ example: '2026-09-26' })
  date!: string;

  @ApiProperty({ description: 'Cumulative gross amount in cents.' })
  amount_cents!: number;
}

export class PaymentsGraphDto {
  @ApiProperty({ type: [PaymentGraphPointDto] })
  points!: PaymentGraphPointDto[];
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
