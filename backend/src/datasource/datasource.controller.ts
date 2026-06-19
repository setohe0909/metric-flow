import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { DatasourceService } from './datasource.service';
import { CreateDatasourceDto, ConnectionSettingsDto } from './dto/datasource.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Configuración de Multer para archivos temporales
const multerStorage = diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.resolve(__dirname, '../../..', 'storage', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.sqlite', '.db', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new BadRequestException('Extensión de archivo no soportada. Solo se permite .sqlite, .db, y .csv'), false);
  }
  cb(null, true);
};

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('datasources')
export class DatasourceController {
  constructor(private readonly datasourceService: DatasourceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateDatasourceDto) {
    return this.datasourceService.create(req.orgId, dto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.datasourceService.findAll(req.orgId);
  }

  @Post('upload-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerStorage,
      fileFilter,
      limits: { fileSize: 20 * 1024 * 1024 }, // Max 20MB
    })
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('type') type: 'sqlite' | 'csv'
  ) {
    if (!type) {
      throw new BadRequestException('El campo tipo (sqlite/csv) es obligatorio.');
    }
    return this.datasourceService.uploadFile(req.orgId, file, name, type);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testConnection(@Request() req, @Body() dto: ConnectionSettingsDto & { type: string }) {
    return this.datasourceService.test(req.orgId, dto);
  }

  @Get(':id/schema')
  async getSchema(@Request() req, @Param('id') id: string) {
    return this.datasourceService.getSchema(req.orgId, id);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.datasourceService.remove(req.orgId, id);
  }
}

