import initSqlJs, { Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || 'database.db';

let db: Database | null = null;

// Generate a random 8-character invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0/O, 1/I/L
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Run migrations for existing databases
const runMigrations = (): void => {
  if (!db) return;

  // Check if families table exists
  const tableCheck = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='families'"
  );

  if (tableCheck.length === 0) {
    console.log('Running migration: Adding family tables...');

    // Create families table
    db.run(`
      CREATE TABLE IF NOT EXISTS families (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        invite_code TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create family_members table
    db.run(`
      CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Check if children table has family_id column
    const childrenInfo = db.exec('PRAGMA table_info(children)');
    const childrenCols =
      childrenInfo.length > 0
        ? childrenInfo[0].values.map((row: (string | number | Uint8Array | null)[]) => row[1] as string)
        : [];

    if (!childrenCols.includes('family_id')) {
      console.log('Migrating existing data to family structure...');

      // Get all users with children
      const usersWithData = db.exec(`
        SELECT DISTINCT u.id, u.name
        FROM users u
        WHERE EXISTS (SELECT 1 FROM children c WHERE c.user_id = u.id)
           OR EXISTS (SELECT 1 FROM tasks t WHERE t.user_id = u.id)
           OR EXISTS (SELECT 1 FROM rewards r WHERE r.user_id = u.id)
      `);

      // Create a family for each user with existing data
      if (usersWithData.length > 0 && usersWithData[0].values.length > 0) {
        for (const [userId, userName] of usersWithData[0].values) {
          const inviteCode = generateInviteCode();
          const familyName = `${userName}'s Family`;

          db.run('INSERT INTO families (name, invite_code) VALUES (?, ?)', [
            familyName,
            inviteCode,
          ]);
          const familyResult = db.exec('SELECT last_insert_rowid()');
          const familyId = familyResult[0].values[0][0];

          db.run(
            'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
            [familyId, userId, 'admin']
          );

          // We'll update the tables after adding columns
          console.log(`Created family "${familyName}" for user ${userId}`);
        }
      }

      // Add family_id and created_by columns to children
      db.run(
        'ALTER TABLE children ADD COLUMN family_id INTEGER REFERENCES families(id) ON DELETE CASCADE'
      );
      db.run(
        'ALTER TABLE children ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL'
      );

      // Add family_id and created_by columns to tasks
      db.run(
        'ALTER TABLE tasks ADD COLUMN family_id INTEGER REFERENCES families(id) ON DELETE CASCADE'
      );
      db.run(
        'ALTER TABLE tasks ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL'
      );

      // Add family_id and created_by columns to rewards
      db.run(
        'ALTER TABLE rewards ADD COLUMN family_id INTEGER REFERENCES families(id) ON DELETE CASCADE'
      );
      db.run(
        'ALTER TABLE rewards ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL'
      );

      // Update existing records with family_id based on user_id
      db.run(`
        UPDATE children SET
          family_id = (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = children.user_id),
          created_by = user_id
        WHERE user_id IN (SELECT user_id FROM family_members)
      `);

      db.run(`
        UPDATE tasks SET
          family_id = (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = tasks.user_id),
          created_by = user_id
        WHERE user_id IN (SELECT user_id FROM family_members)
      `);

      db.run(`
        UPDATE rewards SET
          family_id = (SELECT fm.family_id FROM family_members fm WHERE fm.user_id = rewards.user_id),
          created_by = user_id
        WHERE user_id IN (SELECT user_id FROM family_members)
      `);

      console.log('Migration completed: Family structure added');
    }

    saveDatabase();
  }

  // Migration: Replace is_recurring with repeat_schedule
  const tasksInfo = db.exec('PRAGMA table_info(tasks)');
  const tasksCols =
    tasksInfo.length > 0
      ? tasksInfo[0].values.map((row: (string | number | Uint8Array | null)[]) => row[1] as string)
      : [];

  if (!tasksCols.includes('repeat_schedule')) {
    console.log('Running migration: Adding repeat_schedule column...');

    // Add new column
    db.run('ALTER TABLE tasks ADD COLUMN repeat_schedule TEXT DEFAULT "none"');

    // Migrate existing data: is_recurring = 1 becomes 'daily'
    if (tasksCols.includes('is_recurring')) {
      db.run('UPDATE tasks SET repeat_schedule = "daily" WHERE is_recurring = 1');
      db.run('UPDATE tasks SET repeat_schedule = "none" WHERE is_recurring = 0 OR is_recurring IS NULL');
    }

    console.log('Migration completed: repeat_schedule added');
    saveDatabase();
  }

  // Migration: Add sort_order column to tasks
  const tasksInfoForSort = db.exec('PRAGMA table_info(tasks)');
  const tasksColsForSort =
    tasksInfoForSort.length > 0
      ? tasksInfoForSort[0].values.map((row: (string | number | Uint8Array | null)[]) => row[1] as string)
      : [];

  if (!tasksColsForSort.includes('sort_order')) {
    console.log('Running migration: Adding sort_order column...');

    // Add new column
    db.run('ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0');

    // Initialize sort_order based on creation order (oldest first = lowest sort_order)
    db.run(`
      UPDATE tasks SET sort_order = (
        SELECT COUNT(*) FROM tasks t2
        WHERE t2.family_id = tasks.family_id
        AND t2.created_at < tasks.created_at
      )
    `);

    console.log('Migration completed: sort_order added');
    saveDatabase();
  }
};

const initDatabase = async (): Promise<Database> => {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);

    // Run migrations for existing database
    runMigrations();
  } else {
    db = new SQL.Database();

    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    const statements = schema.split(';').filter((stmt) => stmt.trim());

    statements.forEach((statement) => {
      if (statement.trim()) {
        db!.run(statement);
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

const saveDatabase = (): void => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
};

const getDb = (): Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export { initDatabase, saveDatabase, getDb };
