import { Injectable } from '@nestjs/common';

/** Shape stored in Datasource.accessPolicies */
export interface RolePolicy {
  /** Columns the role is allowed to see. null = no restriction. */
  allowedColumns: string[] | null;
  /** SQL WHERE predicate injected as a sub-query wrapper. null = no restriction. */
  rowFilter: string | null;
}

export interface AccessPolicies {
  viewer?: RolePolicy;
  admin?: RolePolicy;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
}

/** Sentinel returned alongside a QueryResult to signal filtering was applied. */
export interface FilterMeta {
  filtered: boolean;
  appliedPolicy: {
    rowFilter: string | null;
    allowedColumns: string[] | null;
  };
}

/** Policy with no restrictions — used for owner and when no policy is defined. */
const OPEN_POLICY: RolePolicy = { allowedColumns: null, rowFilter: null };

@Injectable()
export class FilteringService {
  /**
   * Resolves the effective policy for a given role.
   * - `owner` always receives OPEN_POLICY (no restrictions).
   * - `admin` / `viewer`: reads from accessPolicies[role]; falls back to OPEN_POLICY
   *   if the datasource has no policy configured for that role.
   */
  getPolicyForRole(
    accessPolicies: AccessPolicies | null | undefined,
    role: string,
  ): RolePolicy {
    if (role === 'owner' || !accessPolicies) {
      return OPEN_POLICY;
    }

    const policy = accessPolicies[role as keyof AccessPolicies];
    if (!policy) {
      return OPEN_POLICY;
    }

    return {
      allowedColumns: policy.allowedColumns ?? null,
      rowFilter: policy.rowFilter ?? null,
    };
  }

  /**
   * Wraps the original SQL with a WHERE clause derived from rowFilter.
   *
   * Injection strategy (sub-query wrap):
   *   SELECT * FROM (<original_sql_without_semicolon>) AS __mf_base__ WHERE <rowFilter>
   *
   * This delegates filtering to the database engine and avoids loading
   * excess rows into the backend process.
   */
  wrapSqlWithRowFilter(sql: string, rowFilter: string | null): string {
    if (!rowFilter || !rowFilter.trim()) {
      return sql;
    }

    // Strip trailing semicolon(s) before wrapping
    const cleanSql = sql.trim().replace(/;+$/, '');
    return `SELECT * FROM (${cleanSql}) AS __mf_base__ WHERE ${rowFilter}`;
  }

  /**
   * Post-execution column projection.
   * Removes columns (and their values in every row) that are not in allowedColumns.
   * If allowedColumns is null, the result is returned unchanged.
   */
  filterColumns(result: QueryResult, allowedColumns: string[] | null): QueryResult {
    if (!allowedColumns) {
      return result;
    }

    // Build an ordered intersection so columns appear in the order they were declared
    const allowed = new Set(allowedColumns.map((c) => c.toLowerCase()));
    const filteredCols = result.columns.filter((c) => allowed.has(c.toLowerCase()));

    const filteredRows = result.rows.map((row) => {
      const filtered: Record<string, any> = {};
      for (const col of filteredCols) {
        // Match case-insensitively but preserve original casing from the result
        const originalKey = Object.keys(row).find(
          (k) => k.toLowerCase() === col.toLowerCase(),
        );
        if (originalKey !== undefined) {
          filtered[originalKey] = row[originalKey];
        }
      }
      return filtered;
    });

    return {
      columns: filteredCols,
      rows: filteredRows,
      rowCount: filteredRows.length,
    };
  }

  /**
   * Convenience method: applies both wrapSqlWithRowFilter (pre-execution)
   * and returns the effective policy + a flag indicating whether any filtering
   * is active. Callers wrap the SQL before executing, then call filterColumns
   * on the result.
   */
  resolveForRole(
    sql: string,
    accessPolicies: AccessPolicies | null | undefined,
    role: string,
  ): { wrappedSql: string; policy: RolePolicy; isFiltered: boolean } {
    const policy = this.getPolicyForRole(accessPolicies, role);
    const wrappedSql = this.wrapSqlWithRowFilter(sql, policy.rowFilter);
    const isFiltered =
      policy.rowFilter !== null || policy.allowedColumns !== null;

    return { wrappedSql, policy, isFiltered };
  }
}
