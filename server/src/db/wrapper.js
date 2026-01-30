import { getDb, saveDatabase } from './init.js';

class PreparedStatement {
  constructor(stmt) {
    this.stmt = stmt;
  }

  run(...params) {
    const db = getDb();
    this.stmt.bind(params);
    this.stmt.step();
    const changes = db.getRowsModified();

    let lastInsertRowid = null;
    try {
      const result = db.exec('SELECT last_insert_rowid()');
      if (result && result[0] && result[0].values && result[0].values[0]) {
        lastInsertRowid = result[0].values[0][0];
      }
    } catch (e) {
      lastInsertRowid = null;
    }

    this.stmt.reset();
    saveDatabase();
    return { changes, lastInsertRowid };
  }

  get(...params) {
    this.stmt.bind(params);
    const result = this.stmt.step() ? this.stmt.getAsObject() : null;
    this.stmt.reset();
    return result;
  }

  all(...params) {
    this.stmt.bind(params);
    const results = [];
    while (this.stmt.step()) {
      results.push(this.stmt.getAsObject());
    }
    this.stmt.reset();
    return results;
  }
}

class DatabaseWrapper {
  prepare(sql) {
    const db = getDb();
    const stmt = db.prepare(sql);
    return new PreparedStatement(stmt);
  }

  exec(sql) {
    const db = getDb();
    db.run(sql);
    saveDatabase();
  }

  transaction(fn) {
    return () => {
      try {
        const result = fn();
        saveDatabase();
        return result;
      } catch (error) {
        throw error;
      }
    };
  }
}

const db = new DatabaseWrapper();

export default db;
