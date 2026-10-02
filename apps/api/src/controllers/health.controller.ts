import { HealthDto } from '@itch/protocol';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthDto {
    return { status: 'ok' };
  }
}
