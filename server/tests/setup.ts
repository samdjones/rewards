import { beforeAll, afterAll, beforeEach } from 'vitest';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setTestDb, clearTestDb } from '../src/db/wrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

// Set test environment before anything else
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.NODE_ENV = 'test';

// Initialize SQL.js once
beforeAll(async () => {
  SQL = await initSqlJs();
});

// Reset database before each test
beforeEach(async () => {
  // Close previous db if exists
  if (db) {
    db.close();
  }

  // Create fresh in-memory database
  db = new SQL!.Database();

  // Read and execute schema
  const schema = readFileSync(join(__dirname, '../src/db/schema.sql'), 'utf-8');
  const statements = schema.split(';').filter((stmt) => stmt.trim());

  statements.forEach((statement) => {
    if (statement.trim()) {
      db!.run(statement);
    }
  });

  db.run('PRAGMA foreign_keys = ON');

  // Inject test database into wrapper
  setTestDb(db);
});

afterAll(() => {
  if (db) {
    db.close();
  }
  clearTestDb();
});
