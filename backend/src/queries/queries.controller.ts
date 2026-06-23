import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { QueriesService } from './queries.service';
import { RunQueryDto, SaveQueryDto } from './dto/queries.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('queries')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runRawQuery(@Request() req, @Body() dto: RunQueryDto) {
    // Viewers pueden ejecutar queries guardadas a través de widgets,
    // pero el SQL libre sigue restringido a owner y admin.
    if (req.userRole === 'viewer') {
      throw new ForbiddenException(
        'Los visualizadores no tienen permiso para ejecutar SQL libre.',
      );
    }
    return this.queriesService.runRaw(
      req.orgId,
      req.user.id,
      req.userRole,
      dto,
    );
  }

  // --- CRUD Rutas (Sprint 3) ---
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: SaveQueryDto) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException(
        'Los visualizadores no pueden guardar consultas.',
      );
    }
    return this.queriesService.create(req.orgId, req.user.id, dto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.queriesService.findAll(req.orgId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.queriesService.findOne(req.orgId, id);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException(
        'Los visualizadores no pueden eliminar consultas.',
      );
    }
    return this.queriesService.remove(req.orgId, id);
  }
}
