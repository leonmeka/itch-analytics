import { Injectable } from '@nestjs/common';

import { ViewsRepository } from '../repositories/views.repository';
import type { CreateGameView, GameView, UpdateGameView } from '../types/views.types';
import { BaseService } from './base.service';

@Injectable()
export class ViewsService extends BaseService<
  GameView,
  CreateGameView,
  UpdateGameView,
  GameView,
  'viewsTable'
> {
  constructor(protected readonly viewsRepository: ViewsRepository) {
    super(viewsRepository);
  }

  getGraph(userId: string) {
    return this.viewsRepository.getGraph(userId);
  }
}
