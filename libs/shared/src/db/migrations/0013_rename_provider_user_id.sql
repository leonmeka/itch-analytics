ALTER TABLE "oauth_identities" RENAME COLUMN "provider_user_id" TO "itch_id";--> statement-breakpoint
ALTER TABLE "oauth_identities" DROP CONSTRAINT "oauth_identities_provider_user_id_unique";--> statement-breakpoint
ALTER TABLE "oauth_identities" ADD CONSTRAINT "oauth_identities_itch_id_unique" UNIQUE("itch_id");
