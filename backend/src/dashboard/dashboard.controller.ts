import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto, UpdateDashboardDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@Controller('dashboards')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateDashboardDto) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para crear dashboards.');
    }
    return this.dashboardService.create(req.orgId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get()
  async findAll(@Request() req) {
    return this.dashboardService.findAll(req.orgId);
  }

  // Rutas públicas (Sin Token JWT ni TenantGuard)
  @Get('public/:token')
  async getPublicDashboard(@Param('token') token: string) {
    return this.dashboardService.getPublicDashboard(token);
  }

  @Get('public/:token/widgets/:widgetId/data')
  async getPublicWidgetData(
    @Param('token') token: string,
    @Param('widgetId') widgetId: string,
  ): Promise<any> {
    return this.dashboardService.getPublicWidgetData(token, widgetId);
  }

  // Rutas protegidas por ID
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.dashboardService.findOne(req.orgId, id);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateDashboardDto) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para editar dashboards.');
    }
    return this.dashboardService.update(req.orgId, id, dto);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Put(':id/layout')
  async updateLayout(
    @Request() req,
    @Param('id') id: string,
    @Body('layouts') layouts: { id: string; x: number; y: number; w: number; h: number }[],
  ) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para modificar el diseño.');
    }
    return this.dashboardService.updateLayout(req.orgId, id, layouts);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Put(':id/public')
  async togglePublic(
    @Request() req,
    @Param('id') id: string,
    @Body('isPublic') isPublic: boolean,
  ) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para cambiar el estado de compartido.');
    }
    return this.dashboardService.togglePublic(req.orgId, id, isPublic);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para eliminar dashboards.');
    }
    return this.dashboardService.remove(req.orgId, id);
  }
}
