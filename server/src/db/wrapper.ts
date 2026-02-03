import { getDb, saveDatabase } from './init.js';
import type { Database, Statement, SqlValue } from 'sql.js';
import type {
  PreparedStatement as IPreparedStatement,
  PreparedStatementResult,
  DatabaseWrapper as IDatabaseWrapper,
} from '../types/database.js';

// Test mode support - allows injecting a test database
let testDb: Database | null = null;

export const setTestDb = (db: Database): void => {
  testDb = db;
};

export const clearTestDb = (): void => {
  testDb = null;
};

const getCurrentDb = (): Database => {
  if (testDb) return testDb;
  return getDb();
};

const maybeSave = (): void => {
  // Don't save in test mode (in-memory db)
  if (!testDb) {
    saveDatabase();
  }
};

class PreparedStatement<T = Record<string, unknown>> implements IPreparedStatement<T> {
  private stmt: Statement;

  constructor(stmt: Statement) {
    this.stmt = stmt;
  }

  run(...params: unknown[]): PreparedStatementResult {
    const db = getCurrentDb();
    this.stmt.bind(params as SqlValue[]);
    this.stmt.step();
    const changes = db.getRowsModified();

    let lastInsertRowid: number | null = null;
    try {
      const result = db.exec('SELECT last_insert_rowid()');
      if (result?.[0]?.values?.[0]?.[0] !== undefined) {
        lastInsertRowid = result[0].values[0][0] as number;
      }
    } catch {
      lastInsertRowid = null;
    }

    this.stmt.reset();
    maybeSave();
    return { changes, lastInsertRowid };
  }

  get(...params: unknown[]): T | null {
    this.stmt.bind(params as SqlValue[]);
    const result = this.stmt.step() ? (this.stmt.getAsObject() as T) : null;
    this.stmt.reset();
    return result;
  }

  all(...params: unknown[]): T[] {
    this.stmt.bind(params as SqlValue[]);
    const results: T[] = [];
    while (this.stmt.step()) {
      results.push(this.stmt.getAsObject() as T);
    }
    this.stmt.reset();
    return results;
  }
}

class DatabaseWrapperImpl implements IDatabaseWrapper {
  prepare<T = Record<string, unknown>>(sql: string): IPreparedStatement<T> {
    const db = getCurrentDb();
    const stmt = db.prepare(sql);
    return new PreparedStatement<T>(stmt);
  }

  exec(sql: string): void {
    const db = getCurrentDb();
    db.run(sql);
    maybeSave();
  }

  transaction<T>(fn: () => T): () => T {
    return () => {
      const result = fn();
      maybeSave();
      return result;
    };
  }
}

const db = new DatabaseWrapperImpl();

export default db;
