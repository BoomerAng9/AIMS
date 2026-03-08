const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.resolve(process.cwd(), 'backend', 'uef-gateway', 'data');
const DB_PATH = path.resolve(DB_DIR, 'aims.db');

console.log('Target DB Path:', DB_PATH);

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

try {
    const db = new Database(DB_PATH);
    console.log('Connected to DB');

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    console.log('Pragmas set');

    // Test a simple table creation
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);
    console.log('_migrations table ensured');

    const migrations = [
        {
            version: '001',
            name: 'create_base_tables',
            up: (db) => {
                db.exec(`
            CREATE TABLE IF NOT EXISTS projects (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              name TEXT NOT NULL,
              description TEXT NOT NULL DEFAULT '',
              complexity TEXT NOT NULL DEFAULT 'simple',
              status TEXT NOT NULL DEFAULT 'intake',
              archetype TEXT NOT NULL DEFAULT '',
              features TEXT NOT NULL DEFAULT '[]',
              integrations TEXT NOT NULL DEFAULT '[]',
              branding TEXT NOT NULL DEFAULT '{}',
              spec TEXT,
              ttl INTEGER,
              createdAt TEXT NOT NULL,
              updatedAt TEXT NOT NULL
            );
          `);
            }
        }
        // Add more if needed to find the failure
    ];

    migrations.forEach(m => {
        console.log(`Testing migration ${m.version}: ${m.name}`);
        m.up(db);
        console.log(`Success: ${m.version}`);
    });

} catch (err) {
    console.error('SQLITE_ERROR_DETAIL:', err);
    process.exit(1);
}
