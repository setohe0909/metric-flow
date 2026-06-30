import {
  Res,
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
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueriesService } from './queries.service';
import { ExportQueryDto, RunQueryDto, SaveQueryDto } from './dto/queries.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { QueryExportService } from './query-export.service';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('queries')
export class QueriesController {
  constructor(
    private readonly queriesService: QueriesService,
    private readonly queryExportService: QueryExportService,
  ) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runRawQuery(@Request() req, @Body() dto: RunQueryDto) {
    return this.queriesService.runRaw(
      req.orgId,
      req.user.id,
      req.userRole,
      dto,
    );
  }

  @Post('cancel/:executionId')
  @HttpCode(HttpStatus.OK)
  async cancelExecution(
    @Request() req,
    @Param('executionId') executionId: string,
  ) {
    return this.queriesService.cancelActiveExecution(
      req.orgId,
      req.user.id,
      executionId,
    );
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  async exportQuery(
    @Request() req,
    @Body() dto: ExportQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.queryExportService.export(
      req.orgId,
      req.user.id,
      req.userRole,
      {
        datasourceId: dto.datasourceId,
        querySql: dto.querySql,
      },
      dto.format,
    );

    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );

    return new StreamableFile(file.body);
  }

  // --- CRUD Rutas (Sprint 3) ---
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: SaveQueryDto) {
    if (req.userRole === 'READER') {
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
    if (req.userRole === 'READER') {
      throw new ForbiddenException(
        'Los visualizadores no pueden eliminar consultas.',
      );
    }
    return this.queriesService.remove(req.orgId, req.user.id, id);
  }
}
