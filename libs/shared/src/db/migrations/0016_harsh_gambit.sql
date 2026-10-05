ALTER TABLE "views" ALTER COLUMN "game_id" SET DATA TYPE uuid USING game_id::uuid;--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
