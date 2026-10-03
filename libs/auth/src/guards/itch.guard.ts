import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import passport from 'passport';
import { OAuthProvider } from '@/libs/shared';

@Injectable()
export class ItchAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    await new Promise<void>((resolve, reject) => {
      passport.authenticate(OAuthProvider.Itch, { session: false }, (error, user) => {
        if (error || !user) {
          reject(error instanceof Error ? error : new UnauthorizedException());
          return;
        }
        request.user = user;
        resolve();
      })(request, response, (error?: unknown) => {
        if (error) {
          reject(error as Error);
          return;
        }
        resolve();
      });
    });

    return true;
  }
}
