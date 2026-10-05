import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthDto } from '@scratch/protocol';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthDto {
    return { status: 'ok' };
  }
}
