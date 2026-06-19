import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Request, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, InviteMemberDto } from './dto/organizations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateOrganizationDto) {
    return this.orgsService.createOrg(req.user.id, dto.name);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get('active')
  async getActive(@Request() req) {
    return this.orgsService.getActive(req.orgId);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Put('active')
  async updateActive(@Request() req, @Body() dto: UpdateOrganizationDto) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para editar los ajustes de la organización.');
    }
    return this.orgsService.update(req.orgId, dto.name);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get('active/members')
  async getMembers(@Request() req) {
    return this.orgsService.getMembers(req.orgId);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post('active/members')
  @HttpCode(HttpStatus.CREATED)
  async inviteMember(@Request() req, @Body() dto: InviteMemberDto) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para agregar miembros.');
    }
    return this.orgsService.inviteMember(req.orgId, dto.email, dto.role);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Delete('active/members/:id')
  async removeMember(@Request() req, @Param('id') membershipId: string) {
    if (req.userRole === 'viewer') {
      throw new ForbiddenException('Los visualizadores no tienen permiso para eliminar miembros.');
    }
    return this.orgsService.removeMember(req.orgId, membershipId, req.user.id);
  }
}
