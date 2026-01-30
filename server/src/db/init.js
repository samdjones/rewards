import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = 'database.db';

let db = null;

const initDatabase = async () => {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();

    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    const statements = schema.split(';').filter(stmt => stmt.trim());

    statements.forEach(statement => {
      if (statement.trim()) {
        db.run(statement);
      }
    });

    db.run('PRAGMA foreign_keys = ON');

    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);

    console.log('Database created and initialized successfully');
  }

  db.run('PRAGMA foreign_keys = ON');
  console.log('Database loaded successfully');

  return db;
};

const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export { initDatabase, saveDatabase, getDb };
