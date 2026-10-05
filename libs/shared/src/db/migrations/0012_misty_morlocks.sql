ALTER TABLE "oauth_identities" DROP CONSTRAINT "oauth_identities_provider_user_id_unique";--> statement-breakpoint
ALTER TABLE "oauth_identities" DROP COLUMN "provider";--> statement-breakpoint
ALTER TABLE "oauth_identities" ADD CONSTRAINT "oauth_identities_provider_user_id_unique" UNIQUE("provider_user_id");--> statement-breakpoint
DROP TYPE "public"."oauth_provider";