import { Injectable } from '@nestjs/common';
import { RfqStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async searchSuppliers(filters: { q?: string; category?: string; country?: string }) {
    const suppliers = await this.prisma.supplierProfile.findMany({
      where: {
        ...(filters.category ? { categories: { has: filters.category } } : {}),
        ...(filters.country ? { countriesServed: { has: filters.country } } : {}),
      },
      include: { organization: true },
      orderBy: [{ rating: 'desc' }, { completedContracts: 'desc' }],
      take: 25,
    });

    const query = filters.q?.toLowerCase().trim();
    if (!query) return suppliers;

    return suppliers.filter((s) => {
      const haystack = [
        s.organization.name,
        s.organization.description,
        s.categories.join(' '),
        s.keywords.join(' '),
        s.certifications.join(' '),
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  async listOpenRfqs() {
    return this.prisma.rfq.findMany({
      where: { status: { in: [RfqStatus.PUBLISHED, RfqStatus.QUOTATION_OPEN] } },
      include: { buyerOrganization: true, lineItems: true },
      orderBy: { closingDate: 'asc' },
      take: 50,
    });
  }
}
