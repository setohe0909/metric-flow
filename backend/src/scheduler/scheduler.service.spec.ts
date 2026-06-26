import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { DatasourceService } from '../datasource/datasource.service';
import { QueryEngineService } from '../query-engine/query-engine.service';
import { EmailService } from './email.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

describe('SchedulerService', () => {
  let service: SchedulerService;

  const mockPrismaService = {
    query: {
      findFirst: jest.fn(),
    },
    scheduledQuery: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scheduleHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    execution: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const mockDatasourceService = {
    findOne: jest.fn(),
  };

  const mockQueryEngineService = {
    executeQuery: jest.fn(),
  };

  const mockEmailService = {
    sendEmailReport: jest.fn().mockResolvedValue(true),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DatasourceService, useValue: mockDatasourceService },
        { provide: QueryEngineService, useValue: mockQueryEngineService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateNextRun', () => {
    it('should correctly calculate the next run for a standard daily cron', () => {
      const cron = '0 9 * * *'; // Every day at 9:00 AM
      const from = new Date('2026-06-23T08:00:00Z');
      const next = service.calculateNextRun(cron, from);
      expect(next).toBeInstanceOf(Date);
      expect(next.getTime()).toBeGreaterThan(from.getTime());
    });

    it('should throw BadRequestException for invalid cron expressions', () => {
      expect(() => {
        service.calculateNextRun('invalid-cron');
      }).toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should throw NotFoundException if query does not exist or org mismatch', async () => {
      mockPrismaService.query.findFirst.mockResolvedValue(null);
      await expect(
        service.create('org-123', {
          queryId: 'query-123',
          name: 'Weekly Report',
          cronExpression: '0 9 * * 1',
          recipients: ['test@example.com'],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should successfully create schedule with valid nextRunAt', async () => {
      const mockQuery = {
        id: 'query-123',
        name: 'Sales Query',
        organizationId: 'org-123',
      };
      mockPrismaService.query.findFirst.mockResolvedValue(mockQuery);

      const expectedDate = new Date();
      jest.spyOn(service, 'calculateNextRun').mockReturnValue(expectedDate);

      const mockCreateResult = {
        id: 'schedule-123',
        queryId: 'query-123',
        name: 'Weekly Report',
        cronExpression: '0 9 * * 1',
        nextRunAt: expectedDate,
      };
      mockPrismaService.scheduledQuery.create.mockResolvedValue(
        mockCreateResult,
      );

      const result = await service.create('org-123', {
        queryId: 'query-123',
        name: 'Weekly Report',
        cronExpression: '0 9 * * 1',
        recipients: ['test@example.com'],
      });

      expect(result).toEqual(mockCreateResult);
      expect(mockPrismaService.scheduledQuery.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-123',
          queryId: 'query-123',
          name: 'Weekly Report',
          cronExpression: '0 9 * * 1',
          recipients: ['test@example.com'],
          subject: null,
          format: 'csv',
          enabled: true,
          nextRunAt: expectedDate,
        },
        include: { query: true },
      });
    });
  });

  describe('format helpers', () => {
    it('should format rows into CSV string correctly', () => {
      const columns = ['id', 'name', 'value'];
      const rows = [
        { id: 1, name: 'Alice', value: 100 },
        { id: 2, name: 'Bob "The Builder"', value: 200 },
      ];
      const serviceWithHelpers = service as unknown as {
        formatCsv(columns: string[], rows: Record<string, unknown>[]): string;
      };
      const csv = serviceWithHelpers.formatCsv(columns, rows);
      expect(csv).toContain('"id","name","value"');
      expect(csv).toContain('"1","Alice","100"');
      expect(csv).toContain('"2","Bob ""The Builder""","200"');
    });

    it('should format columns and rows to HTML table', () => {
      const columns = ['name', 'age'];
      const rows = [{ name: 'Charlie', age: 30 }];
      const serviceWithHelpers = service as unknown as {
        formatHtmlTable(
          columns: string[],
          rows: Record<string, unknown>[],
        ): string;
      };
      const html = serviceWithHelpers.formatHtmlTable(columns, rows);
      expect(html).toContain('<table');
      expect(html).toContain('name');
      expect(html).toContain('age');
      expect(html).toContain('Charlie');
      expect(html).toContain('30');
    });
  });
});
