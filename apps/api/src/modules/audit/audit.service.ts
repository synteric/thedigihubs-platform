import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AuditInput = {
  actorId?: string;
  rfqId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonObject;
  ipAddress?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        rfqId: input.rfqId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: input.metadata || {},
        ipAddress: input.ipAddress,
      },
    });
  }
}
