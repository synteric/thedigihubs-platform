import { Controller, Get, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Get('suppliers')
  searchSuppliers(@Query('q') q?: string, @Query('category') category?: string, @Query('country') country?: string) {
    return this.marketplace.searchSuppliers({ q, category, country });
  }

  @Get('rfqs')
  listOpenRfqs() {
    return this.marketplace.listOpenRfqs();
  }
}
