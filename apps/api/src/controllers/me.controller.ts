import { ItchKeyStatusDto } from '@itch/protocol';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type AuthenticatedRequest, AuthGuard, ItchKeysService } from '@/libs/auth';
import { ItchService } from '@/libs/itch';

@ApiTags('me')
@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(
    private readonly itchKeysService: ItchKeysService,
    private readonly itchService: ItchService,
  ) {}

  /** Whether the signed-in user has an itch.io API key configured. */
  @Get('itch-key-status')
  async itchKeyStatus(@Req() request: AuthenticatedRequest): Promise<ItchKeyStatusDto> {
    return { configured: await this.itchKeysService.hasKey(request.user.id) };
  }

  /** Stores the user's itch.io API key (validated against itch, encrypted). */
  @Put('itch-key')
  async setItchKey(
    @Req() request: AuthenticatedRequest,
    @Body() body: { api_key?: string },
  ): Promise<ItchKeyStatusDto> {
    const apiKey = body.api_key?.trim();

    if (!apiKey) {
      throw new BadRequestException('api_key is required');
    }

    if (!(await this.itchService.validateApiKey(apiKey))) {
      throw new BadRequestException('API key was rejected by itch.io');
    }

    await this.itchKeysService.setKey(request.user.id, apiKey);

    return { configured: true };
  }

  /** Removes the stored itch.io API key. */
  @Delete('itch-key')
  async deleteItchKey(@Req() request: AuthenticatedRequest): Promise<ItchKeyStatusDto> {
    await this.itchKeysService.deleteKey(request.user.id);

    return { configured: false };
  }
}
