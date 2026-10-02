import { Injectable } from '@nestjs/common';

import { UsersRepository } from '../repositories/users.repository';
import type { CreateUser, UpdateUser, User } from '../types/users.types';
import { BaseService } from './base.service';

@Injectable()
export class UsersService extends BaseService<User, CreateUser, UpdateUser, User, 'usersTable'> {
  constructor(protected readonly usersRepository: UsersRepository) {
    super(usersRepository);
  }
}
