import { Test, TestingModule } from '@nestjs/testing';
import { FilteringService, QueryResult } from './filtering.service';

describe('FilteringService', () => {
  let service: FilteringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilteringService],
    }).compile();

    service = module.get<FilteringService>(FilteringService);
  });

  // ─── getPolicyForRole ──────────────────────────────────────────────────────

  describe('getPolicyForRole', () => {
    it('should return open policy for owner regardless of accessPolicies', () => {
      const policies = {
        ADMIN: { allowedColumns: ['id'], rowFilter: "region = 'US'" } as any,
        READER: { allowedColumns: ['id'], rowFilter: "region = 'LATAM'" },
      };
      const result = service.getPolicyForRole(policies, 'ADMIN');
      expect(result).toEqual({ allowedColumns: null, rowFilter: null });
    });

    it('should return open policy when accessPolicies is null', () => {
      const result = service.getPolicyForRole(null, 'READER');
      expect(result).toEqual({ allowedColumns: null, rowFilter: null });
    });

    it('should return open policy when accessPolicies is undefined', () => {
      const result = service.getPolicyForRole(undefined, 'EDITOR');
      expect(result).toEqual({ allowedColumns: null, rowFilter: null });
    });

    it('should return viewer policy when defined', () => {
      const policies = {
        READER: { allowedColumns: ['id', 'name'], rowFilter: "country = 'CO'" },
      };
      const result = service.getPolicyForRole(policies, 'READER');
      expect(result).toEqual({
        allowedColumns: ['id', 'name'],
        rowFilter: "country = 'CO'",
      });
    });

    it('should return admin policy when defined', () => {
      const policies = {
        EDITOR: { allowedColumns: null, rowFilter: 'deleted_at IS NULL' },
      };
      const result = service.getPolicyForRole(policies, 'EDITOR');
      expect(result).toEqual({
        allowedColumns: null,
        rowFilter: 'deleted_at IS NULL',
      });
    });

    it('should return open policy for admin when no admin policy is defined', () => {
      const policies = {
        READER: { allowedColumns: ['id'], rowFilter: "region = 'US'" },
      };
      const result = service.getPolicyForRole(policies, 'EDITOR');
      expect(result).toEqual({ allowedColumns: null, rowFilter: null });
    });

    it('should handle policy with null allowedColumns (column restriction disabled)', () => {
      const policies = {
        READER: { allowedColumns: null, rowFilter: "region = 'LATAM'" },
      };
      const result = service.getPolicyForRole(policies, 'READER');
      expect(result.allowedColumns).toBeNull();
      expect(result.rowFilter).toBe("region = 'LATAM'");
    });
  });

  // ─── wrapSqlWithRowFilter ──────────────────────────────────────────────────

  describe('wrapSqlWithRowFilter', () => {
    it('should return sql unchanged when rowFilter is null', () => {
      const sql = 'SELECT * FROM users LIMIT 100';
      expect(service.wrapSqlWithRowFilter(sql, null)).toBe(sql);
    });

    it('should return sql unchanged when rowFilter is empty string', () => {
      const sql = 'SELECT id, name FROM orders';
      expect(service.wrapSqlWithRowFilter(sql, '')).toBe(sql);
    });

    it('should wrap sql with WHERE clause', () => {
      const sql = 'SELECT * FROM sales';
      const result = service.wrapSqlWithRowFilter(sql, "region = 'LATAM'");
      expect(result).toBe(
        "SELECT * FROM (SELECT * FROM sales) AS __mf_base__ WHERE region = 'LATAM'",
      );
    });

    it('should strip trailing semicolon before wrapping', () => {
      const sql = 'SELECT id, amount FROM invoices;';
      const result = service.wrapSqlWithRowFilter(sql, 'status = 1');
      expect(result).not.toContain('invoices;');
      expect(result).toContain('__mf_base__');
      expect(result).toContain('status = 1');
    });

    it('should handle complex row filters with AND', () => {
      const sql = 'SELECT * FROM events';
      const filter = "country = 'CO' AND deleted_at IS NULL";
      const result = service.wrapSqlWithRowFilter(sql, filter);
      expect(result).toBe(
        `SELECT * FROM (SELECT * FROM events) AS __mf_base__ WHERE ${filter}`,
      );
    });

    it('should handle sql with existing LIMIT', () => {
      const sql = 'SELECT * FROM logs LIMIT 50';
      const result = service.wrapSqlWithRowFilter(sql, 'level = 1');
      expect(result).toContain('LIMIT 50');
      expect(result).toContain('level = 1');
    });
  });

  // ─── filterColumns ─────────────────────────────────────────────────────────

  describe('filterColumns', () => {
    const baseResult: QueryResult = {
      columns: ['id', 'name', 'salary', 'department'],
      rows: [
        { id: 1, name: 'Alice', salary: 90000, department: 'Engineering' },
        { id: 2, name: 'Bob', salary: 85000, department: 'Design' },
      ],
      rowCount: 2,
    };

    it('should return result unchanged when allowedColumns is null', () => {
      const result = service.filterColumns(baseResult, null);
      expect(result).toEqual(baseResult);
    });

    it('should filter columns to only allowed ones', () => {
      const result = service.filterColumns(baseResult, ['id', 'name']);
      expect(result.columns).toEqual(['id', 'name']);
      expect(result.rows[0]).toEqual({ id: 1, name: 'Alice' });
      expect(result.rows[0]).not.toHaveProperty('salary');
      expect(result.rows[0]).not.toHaveProperty('department');
    });

    it('should handle case-insensitive column matching', () => {
      const result = service.filterColumns(baseResult, ['ID', 'NAME']);
      expect(result.columns.map((c) => c.toLowerCase())).toContain('id');
      expect(result.columns.map((c) => c.toLowerCase())).toContain('name');
    });

    it('should ignore allowedColumns entries that do not exist in the result', () => {
      const result = service.filterColumns(baseResult, [
        'id',
        'nonexistent_column',
      ]);
      expect(result.columns).toEqual(['id']);
      expect(result.rows[0]).toEqual({ id: 1 });
    });

    it('should preserve rowCount after column filtering', () => {
      const result = service.filterColumns(baseResult, ['id']);
      expect(result.rowCount).toBe(2);
    });

    it('should handle empty rows gracefully', () => {
      const emptyResult: QueryResult = {
        columns: ['id', 'name'],
        rows: [],
        rowCount: 0,
      };
      const result = service.filterColumns(emptyResult, ['id']);
      expect(result.columns).toEqual(['id']);
      expect(result.rows).toEqual([]);
    });
  });

  // ─── resolveForRole ────────────────────────────────────────────────────────

  describe('resolveForRole', () => {
    it('should return unmodified sql and isFiltered=false for owner', () => {
      const sql = 'SELECT * FROM orders';
      const policies = {
        READER: { allowedColumns: ['id'], rowFilter: "status = 'paid'" },
      };
      const { wrappedSql, isFiltered } = service.resolveForRole(
        sql,
        policies,
        'ADMIN',
      );
      expect(wrappedSql).toBe(sql);
      expect(isFiltered).toBe(false);
    });

    it('should wrap sql and return isFiltered=true for viewer with rowFilter', () => {
      const sql = 'SELECT * FROM orders';
      const policies = {
        READER: { allowedColumns: null, rowFilter: "status = 'paid'" },
      };
      const { wrappedSql, isFiltered, policy } = service.resolveForRole(
        sql,
        policies,
        'READER',
      );
      expect(wrappedSql).toContain("status = 'paid'");
      expect(isFiltered).toBe(true);
      expect(policy.rowFilter).toBe("status = 'paid'");
    });

    it('should return isFiltered=true when only allowedColumns is restricted', () => {
      const sql = 'SELECT * FROM users';
      const policies = {
        EDITOR: { allowedColumns: ['id', 'email'], rowFilter: null },
      };
      const { isFiltered } = service.resolveForRole(sql, policies, 'EDITOR');
      expect(isFiltered).toBe(true);
    });

    it('should return isFiltered=false when no policies are configured', () => {
      const { isFiltered } = service.resolveForRole('SELECT 1', null, 'READER');
      expect(isFiltered).toBe(false);
    });
  });
});
