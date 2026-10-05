import { Module } from '@nestjs/common';

import { DatabaseModule } from '../db/db.module';
import { ApiKeysRepository } from '../repositories/api-keys.repository';
import { ApiKeysService } from '../services/api-keys.service';

@Module({
  imports: [DatabaseModule],
  providers: [ApiKeysService, ApiKeysRepository],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
