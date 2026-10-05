import { Module } from '@nestjs/common';

import { DatabaseModule } from '../db/db.module';
import { GamesRepository } from '../repositories/games.repository';
import { GamesService } from '../services/games.service';

@Module({
  imports: [DatabaseModule],
  providers: [GamesService, GamesRepository],
  exports: [GamesService],
})
export class GamesModule {}
