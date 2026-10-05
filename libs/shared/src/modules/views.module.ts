import { Module } from '@nestjs/common';

import { DatabaseModule } from '../db/db.module';
import { ViewsRepository } from '../repositories/views.repository';
import { ViewsService } from '../services/views.service';

@Module({
  imports: [DatabaseModule],
  providers: [ViewsService, ViewsRepository],
  exports: [ViewsService],
})
export class ViewsModule {}
