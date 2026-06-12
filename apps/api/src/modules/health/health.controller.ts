import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/health')
  health() {
    return {
      status: 'ok',
      service: 'TheDigiHubs API',
      time: new Date().toISOString(),
    };
  }

  @Get('/ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ready',
      service: 'TheDigiHubs API',
      checks: {
        database: 'ok',
      },
      time: new Date().toISOString(),
    };
  }
}
