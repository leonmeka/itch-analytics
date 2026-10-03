-- Consolidate price/payout money fields to integer cents.
-- amount ("89.00", decimal) duplicates amount_cents; created_at_csv duplicates
-- purchased_at (parsed from it) — both are data-verified identical, so dropped.
-- The remaining money columns are renamed to *_cents and converted:
--   product_price was already bare cents; the fee/delivered columns were
--   decimal dollars and multiply by 100.
ALTER TABLE "payments" RENAME COLUMN "product_price" TO "product_price_cents";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "product_price_cents" TYPE integer USING round(nullif(product_price_cents, '')::numeric);--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "tax_added" TO "tax_added_cents";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "tax_added_cents" TYPE integer USING round(nullif(tax_added_cents, '')::numeric * 100);--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "tip" TO "tip_cents";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "tip_cents" TYPE integer USING round(nullif(tip_cents, '')::numeric * 100);--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "marketplace_fee" TO "marketplace_fee_cents";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "marketplace_fee_cents" TYPE integer USING round(nullif(marketplace_fee_cents, '')::numeric * 100);--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "source_fee" TO "source_fee_cents";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "source_fee_cents" TYPE integer USING round(nullif(source_fee_cents, '')::numeric * 100);--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "amount_delivered" TO "amount_delivered_cents";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount_delivered_cents" TYPE integer USING round(nullif(amount_delivered_cents, '')::numeric * 100);--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "created_at_csv";
