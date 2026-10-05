ALTER TABLE "payments" DROP CONSTRAINT "payments_game_id_games_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "game_id";