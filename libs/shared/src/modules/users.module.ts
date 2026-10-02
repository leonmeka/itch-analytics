import { Module } from '@nestjs/common';

import { DatabaseModule } from '../db/db.module';
import { UsersRepository } from '../repositories/users.repository';
import { UsersService } from '../services/users.service';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
