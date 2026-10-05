CREATE TABLE "views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" text NOT NULL,
	"date" date NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "views_user_game_date_unique" ON "views" USING btree ("user_id","game_id","date");--> statement-breakpoint
CREATE INDEX "views_user_idx" ON "views" USING btree ("user_id");