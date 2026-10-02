import { ItchGameDto, ItchProfileDto } from '@itch/protocol';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type AuthenticatedRequest, AuthGuard } from '@/libs/auth';
import { ItchService } from '@/libs/itch';

@ApiTags('itch')
@Controller('itch')
@UseGuards(AuthGuard)
export class ItchController {
  constructor(private readonly itchService: ItchService) {}

  /**
   * itch.io access tokens are never persisted server-side: the client posts
   * them with each request (Authorization header, forwarded by the OAuth
   * callback to the app) and they are used for this request only.
   */

  /** itch.io profile of the OAuth'd user. */
  @Get('me')
  async getItchProfile(@Req() request: AuthenticatedRequest): Promise<ItchProfileDto | null> {
    const accessToken = this.getItchAccessToken(request);
    if (!accessToken) return null;

    return this.itchService.getProfile(accessToken);
  }

  /** itch.io games the OAuth'd user develops (profile:games scope). */
  @Get('games')
  async getMyGames(@Req() request: AuthenticatedRequest): Promise<ItchGameDto[]> {
    const accessToken = this.getItchAccessToken(request);
    if (!accessToken) return [];

    return this.itchService.getMyGames(accessToken);
  }

  private getItchAccessToken(request: AuthenticatedRequest): string | null {
    const raw = request.headers.authorization;

    if (!raw?.startsWith('Bearer ')) {
      return null;
    }

    return raw.slice('Bearer '.length) || null;
  }
}
