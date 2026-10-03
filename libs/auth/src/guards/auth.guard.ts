import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { schema, UsersService } from '@/libs/shared';

import type { AuthenticatedRequest } from '../auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice('Bearer '.length)
      : null;

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: { sub: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; type?: string }>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.usersService.find({
      where: eq(schema.usersTable.id, payload.sub),
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    request.user = user;
    const itchToken = request.headers['x-itch-token'];

    request.itchAccessToken = typeof itchToken === 'string' ? itchToken : null;

    return true;
  }
}
