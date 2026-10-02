import { Module } from '@nestjs/common';

import { DatabaseModule } from '../db/db.module';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { RefreshTokensService } from '../services/refresh-tokens.service';

@Module({
  imports: [DatabaseModule],
  providers: [RefreshTokensService, RefreshTokensRepository],
  exports: [RefreshTokensService],
})
export class RefreshTokensModule {}
