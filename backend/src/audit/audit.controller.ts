import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { AuditService } from './audit.service';

interface AuditRequest {
  userRole: string;
  orgId: string;
}

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findRecent(
    @Request() req: AuditRequest,
    @Query('limit') limit?: string,
  ) {
    if (req.userRole === 'READER') {
      throw new ForbiddenException(
        'Los visualizadores no pueden consultar la auditoría.',
      );
    }

    const parsedLimit = limit ? Number(limit) : 100;
    return this.auditService.listRecent(req.orgId, parsedLimit);
  }
}
