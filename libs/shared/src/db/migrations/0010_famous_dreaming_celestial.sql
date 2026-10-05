CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"oauth_identity_id" uuid NOT NULL,
	"access_token_encrypted" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_oauth_identity_id_oauth_identities_id_fk" FOREIGN KEY ("oauth_identity_id") REFERENCES "public"."oauth_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_oauth_identity_unique" ON "api_keys" USING btree ("oauth_identity_id");--> statement-breakpoint
ALTER TABLE "oauth_identities" DROP COLUMN "access_token_encrypted";