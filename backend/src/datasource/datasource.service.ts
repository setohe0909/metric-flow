import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { QueryEngineService } from '../query-engine/query-engine.service';
import {
  CreateDatasourceDto,
  ConnectionSettingsDto,
  UpdateAccessPoliciesDto,
} from './dto/datasource.dto';
import { CsvImporterService } from './csv-importer.service';
import { AccessPolicies } from './filtering.service';
import { Prisma } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DatasourceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly queryEngine: QueryEngineService,
    private readonly csvImporter: CsvImporterService,
  ) {}

  async create(orgId: string, dto: CreateDatasourceDto) {
    // 1. Probar conexión antes de guardar (pero capturar error para permitir guardar de todos modos)
    let warning: string | undefined;
    try {
      await this.queryEngine.testConnection(
        dto.type,
        dto.connectionSettings,
        orgId,
      );
    } catch (error) {
      warning = `Conector guardado con advertencias: ${error.message}`;
    }

    // 2. Encriptar credenciales sensibles (como el password de la DB)
    const settingsCopy = { ...dto.connectionSettings };
    if (settingsCopy.password) {
      settingsCopy.password = this.encryption.encrypt(settingsCopy.password);
    }

    const encryptedSettingsJson = JSON.stringify(settingsCopy);

    // 3. Guardar en base de datos
    const datasource = await this.prisma.datasource.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        type: dto.type,
        connectionSettings: encryptedSettingsJson,
      },
    });

    return {
      id: datasource.id,
      name: datasource.name,
      type: datasource.type,
      warning,
    };
  }

  async findAll(orgId: string) {
    const datasources = await this.prisma.datasource.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    // Limpiar contraseñas antes de retornar
    return datasources.map((ds) => {
      const settings = JSON.parse(
        ds.connectionSettings,
      ) as ConnectionSettingsDto;
      if (settings.password) {
        settings.password = '••••••••'; // Ocultar credencial real
      }
      return {
        id: ds.id,
        name: ds.name,
        type: ds.type,
        connectionSettings: settings,
        accessPolicies: (ds.accessPolicies as AccessPolicies) ?? null,
        hasPolicies: ds.accessPolicies !== null,
        createdAt: ds.createdAt,
      };
    });
  }

  async findOne(orgId: string, id: string) {
    const ds = await this.prisma.datasource.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!ds) {
      throw new NotFoundException('Conector no encontrado');
    }

    const settings = JSON.parse(ds.connectionSettings) as ConnectionSettingsDto;
    // Desencriptar contraseña si se requiere para uso interno
    if (settings.password && settings.password !== '••••••••') {
      settings.password = this.encryption.decrypt(settings.password);
    }

    return {
      id: ds.id,
      name: ds.name,
      type: ds.type,
      connectionSettings: settings,
      accessPolicies: (ds.accessPolicies as AccessPolicies) ?? null,
    };
  }

  async remove(orgId: string, id: string) {
    const ds = await this.prisma.datasource.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!ds) {
      throw new NotFoundException('Conector no encontrado');
    }

    await this.prisma.datasource.delete({
      where: { id },
    });

    return { success: true };
  }

  // Permite testear una conexión antes de guardarla
  async test(orgId: string, dto: ConnectionSettingsDto & { type: string }) {
    if (!dto.type) {
      throw new BadRequestException('El campo tipo es requerido');
    }

    // Si envían password oculto "••••••••", significa que es una DB existente que no están modificando la password.
    await this.queryEngine.testConnection(dto.type, dto, orgId);
    return { success: true, message: 'Conexión exitosa' };
  }

  /**
   * Actualiza las políticas de acceso por rol de un datasource.
   * Solo el owner puede modificar las políticas.
   */
  async updatePolicies(
    orgId: string,
    datasourceId: string,
    userRole: string,
    dto: UpdateAccessPoliciesDto,
  ) {
    if (userRole !== 'owner') {
      throw new ForbiddenException(
        'Solo el owner puede configurar políticas de acceso',
      );
    }

    const ds = await this.prisma.datasource.findFirst({
      where: { id: datasourceId, organizationId: orgId },
    });

    if (!ds) {
      throw new NotFoundException('Conector no encontrado');
    }

    // Construir el objeto de políticas normalizado
    const policies: AccessPolicies = {};

    if (dto.viewer !== undefined) {
      policies.viewer = {
        allowedColumns: dto.viewer.allowedColumns ?? null,
        rowFilter: dto.viewer.rowFilter ?? null,
      };
    }

    if (dto.admin !== undefined) {
      policies.admin = {
        allowedColumns: dto.admin.allowedColumns ?? null,
        rowFilter: dto.admin.rowFilter ?? null,
      };
    }

    // Si el objeto resultante está vacío, limpiar las políticas usando Prisma.JsonNull
    const finalPolicies: Prisma.InputJsonValue | typeof Prisma.JsonNull =
      Object.keys(policies).length > 0 ? (policies as Prisma.InputJsonValue) : Prisma.JsonNull;

    const updated = await this.prisma.datasource.update({
      where: { id: datasourceId },
      data: { accessPolicies: finalPolicies },
    });

    return {
      id: updated.id,
      name: updated.name,
      accessPolicies: (updated.accessPolicies as AccessPolicies) ?? null,
      message: finalPolicies
        ? 'Políticas de acceso actualizadas correctamente'
        : 'Políticas de acceso eliminadas',
    };
  }

  async uploadFile(
    orgId: string,
    file: Express.Multer.File,
    name: string,
    type: 'sqlite' | 'csv',
  ) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }

    // Resolver ruta de base de datos SQLite específica de la organización
    const storageDir = path.resolve(
      __dirname,
      '../../..',
      'storage',
      `org_${orgId}`,
    );
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    let filePath = file.filename;

    if (type === 'csv') {
      // Para CSV, importamos su contenido a la base de datos SQLite central de la organización
      const centralDbName = 'org_database.sqlite';
      const sqliteDbPath = path.resolve(storageDir, centralDbName);

      // Sanitizar el nombre del CSV para usarlo como nombre de tabla SQL
      const tableName = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)+/g, '');

      // Invocar CSV importer
      await this.csvImporter.importCsvToSqlite(
        file.path,
        tableName,
        sqliteDbPath,
      );

      // Eliminar el archivo CSV temporal subido de disco para liberar espacio
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error unlinking temp CSV file:', err);
      }

      // Para conectarnos, utilizaremos el archivo central de la organización
      filePath = centralDbName;

      // Buscar si ya existe la conexión SQLite central ("MetricFlow Managed DB")
      const existingDs = await this.prisma.datasource.findFirst({
        where: {
          organizationId: orgId,
          type: 'sqlite',
          name: 'MetricFlow Managed DB',
        },
      });

      if (existingDs) {
        return {
          id: existingDs.id,
          name: existingDs.name,
          type: 'sqlite',
          tableName,
          message: `Tabla '${tableName}' importada con éxito en MetricFlow Managed DB`,
        };
      } else {
        // Crear conexión central
        const settings = { filePath: centralDbName };
        const datasource = await this.prisma.datasource.create({
          data: {
            organizationId: orgId,
            name: 'MetricFlow Managed DB',
            type: 'sqlite',
            connectionSettings: JSON.stringify(settings),
          },
        });
        return {
          id: datasource.id,
          name: datasource.name,
          type: 'sqlite',
          tableName,
          message: `Tabla '${tableName}' importada y conector creado con éxito`,
        };
      }
    } else {
      // Para SQLite subido directamente (.sqlite, .db)
      const settings = { filePath };
      const datasource = await this.prisma.datasource.create({
        data: {
          organizationId: orgId,
          name: name || file.originalname,
          type: 'sqlite',
          connectionSettings: JSON.stringify(settings),
        },
      });

      return {
        id: datasource.id,
        name: datasource.name,
        type: 'sqlite',
        message: 'Base de datos SQLite subida con éxito',
      };
    }
  }

  async getSchema(orgId: string, id: string) {
    const ds = await this.findOne(orgId, id);
    return this.queryEngine.getDbSchema(ds.type, ds.connectionSettings, orgId);
  }
}
