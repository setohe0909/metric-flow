import { Controller, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { CreateWidgetDto, UpdateWidgetDto } from './dto/widget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('widgets')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateWidgetDto) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para agregar widgets.');
    }
    return this.widgetService.create(req.orgId, dto);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateWidgetDto) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para modificar widgets.');
    }
    return this.widgetService.update(req.orgId, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para eliminar widgets.');
    }
    return this.widgetService.remove(req.orgId, id);
  }
}
