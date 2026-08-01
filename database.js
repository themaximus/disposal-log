const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Persistent data directory support for Railway volume or local fallback
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || __dirname;
if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
}

const dbPath = path.resolve(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database at ' + dbPath, err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);

        // Users table for Google & GitHub OAuth
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            name TEXT,
            avatar_url TEXT,
            provider TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Sessions table for token authentication
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Tasks table
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            difficulty INTEGER DEFAULT 1,
            status TEXT DEFAULT 'todo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            telegram_message_id INTEGER,
            images_json TEXT,
            telegram_message_ids_json TEXT,
            tags_json TEXT,
            position INTEGER DEFAULT 0,
            parent_id INTEGER,
            group_id TEXT
        )`, (err) => {
            if (!err) {
                db.run(`ALTER TABLE tasks ADD COLUMN user_id INTEGER`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN telegram_message_id INTEGER`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN images_json TEXT`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN telegram_message_ids_json TEXT`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN tags_json TEXT`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN parent_id INTEGER`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN group_id TEXT`, () => {});
            }
        });

        // Tags table
        db.run(`CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#3b82f6'
        )`, (err) => {
            if (!err) {
                db.run(`ALTER TABLE tags ADD COLUMN user_id INTEGER`, () => {});
            }
        });
    }
});

module.exports = db;
