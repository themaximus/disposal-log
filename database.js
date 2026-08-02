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

        db.run("PRAGMA journal_mode = WAL;");
        db.run("PRAGMA foreign_keys = ON;");

        // Users table for Google & GitHub OAuth
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            name TEXT,
            avatar_url TEXT,
            provider TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            share_mode TEXT DEFAULT 'link',
            share_token TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (!err) {
                db.run(`ALTER TABLE users ADD COLUMN share_mode TEXT DEFAULT 'link'`, () => {});
                db.run(`ALTER TABLE users ADD COLUMN share_token TEXT`, () => {});
                db.run(`ALTER TABLE users ADD COLUMN google_access_token TEXT`, () => {});
            }
        });

        // Board Access Table for restricted invited users
        db.run(`CREATE TABLE IF NOT EXISTS board_access (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER,
            board_id INTEGER,
            granted_email TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (!err) {
                db.run(`ALTER TABLE board_access ADD COLUMN board_id INTEGER`, () => {});
            }
        });

        // Sessions table for token authentication
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Boards table for multi-board support
        db.run(`CREATE TABLE IF NOT EXISTS boards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT DEFAULT '📋',
            share_mode TEXT DEFAULT 'link',
            share_token TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`, (err) => {
            if (!err) {
                db.run(`ALTER TABLE boards ADD COLUMN icon TEXT DEFAULT '📋'`, () => {});
                db.run(`ALTER TABLE boards ADD COLUMN share_mode TEXT DEFAULT 'link'`, () => {});
                db.run(`ALTER TABLE boards ADD COLUMN share_token TEXT`, () => {});
            }
        });

        // Columns table for dynamic Kanban process columns
        db.run(`CREATE TABLE IF NOT EXISTS columns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            board_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            column_key TEXT NOT NULL,
            color TEXT DEFAULT '#388bfd',
            position INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
        )`);

        // Tasks table
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            board_id INTEGER,
            column_id INTEGER,
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
            group_id TEXT,
            subtasks_json TEXT
        )`, (err) => {
            if (!err) {
                db.run(`ALTER TABLE tasks ADD COLUMN user_id INTEGER`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN board_id INTEGER`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN column_id INTEGER`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN telegram_message_id INTEGER`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN images_json TEXT`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN telegram_message_ids_json TEXT`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN tags_json TEXT`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN parent_id INTEGER`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN group_id TEXT`, () => {});
                db.run(`ALTER TABLE tasks ADD COLUMN subtasks_json TEXT`, () => {});
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

        // Settings table for persistent configuration
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);
    }
});

module.exports = db;
