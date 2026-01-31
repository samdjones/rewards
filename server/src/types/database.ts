import type { Database, Statement, SqlValue } from 'sql.js';

export type { Database, Statement, SqlValue };

export interface PreparedStatementResult {
  changes: number;
  lastInsertRowid: number | null;
}

export interface PreparedStatement<T = Record<string, unknown>> {
  run(...params: unknown[]): PreparedStatementResult;
  get(...params: unknown[]): T | null;
  all(...params: unknown[]): T[];
}

export interface DatabaseWrapper {
  prepare<T = Record<string, unknown>>(sql: string): PreparedStatement<T>;
  exec(sql: string): void;
  transaction<T>(fn: () => T): () => T;
}
