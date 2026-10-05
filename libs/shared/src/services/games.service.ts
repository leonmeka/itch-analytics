import { Injectable } from '@nestjs/common';

import { GamesRepository } from '../repositories/games.repository';
import type { CreateGame, Game, UpdateGame } from '../types/games.types';
import { BaseService } from './base.service';

@Injectable()
export class GamesService extends BaseService<Game, CreateGame, UpdateGame, Game, 'gamesTable'> {
  constructor(protected readonly gamesRepository: GamesRepository) {
    super(gamesRepository);
  }
}
