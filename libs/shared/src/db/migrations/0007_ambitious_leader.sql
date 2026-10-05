CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"short_text" text,
	"cover_url" text,
	"classification" text,
	"type" text,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"external_created_at" timestamp,
	"min_price" integer,
	"views_count" integer,
	"downloads_count" integer,
	"purchases_count" integer,
	"traits" jsonb,
	"earnings" jsonb
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "games_user_external_unique" ON "games" USING btree ("user_id","external_id");--> statement-breakpoint
CREATE INDEX "games_user_idx" ON "games" USING btree ("user_id");