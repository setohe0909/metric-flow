import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/scheduler.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

interface AuthenticatedRequest {
  userRole: string;
  orgId: string;
}

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('schedules')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateScheduleDto,
  ) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException(
        'Los visualizadores no tienen permisos para programar reportes.',
      );
    }
    return this.schedulerService.create(req.orgId, dto);
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.schedulerService.findAll(req.orgId);
  }

  @Get('query/:queryId')
  async findByQuery(
    @Request() req: AuthenticatedRequest,
    @Param('queryId') queryId: string,
  ) {
    return this.schedulerService.findByQuery(req.orgId, queryId);
  }

  @Get(':id')
  async findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.schedulerService.findOne(req.orgId, id);
  }

  @Patch(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException(
        'Los visualizadores no tienen permisos para modificar programaciones.',
      );
    }
    return this.schedulerService.update(req.orgId, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException(
        'Los visualizadores no tienen permisos para eliminar programaciones.',
      );
    }
    return this.schedulerService.remove(req.orgId, id);
  }

  @Get(':id/history')
  async getHistory(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.schedulerService.getHistory(req.orgId, id);
  }
}
