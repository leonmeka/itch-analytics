import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ItchService } from './itch.service';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.itch.io',
      timeout: 5000,
    }),
  ],
  providers: [ItchService],
  exports: [ItchService],
})
export class ItchModule {}
