const db = require('./index');

const TABLES = [
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        name TEXT,
        avatar_url TEXT,
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        share_mode TEXT DEFAULT 'link',
        share_token TEXT,
        google_access_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT '📋',
        share_mode TEXT DEFAULT 'link',
        share_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS board_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        board_id INTEGER,
        granted_email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        board_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        column_key TEXT NOT NULL,
        color TEXT DEFAULT '#388bfd',
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS tasks (
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
        subtasks_json TEXT,
        deleted_at DATETIME
    )`,
    `CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#3b82f6'
    )`,
    // Legacy global key/value settings; superseded by user_settings.
    `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        PRIMARY KEY (user_id, key),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS diagrams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        xml TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
];

// Columns added after the first releases. Older databases are upgraded in place.
const ADDED_COLUMNS = {
    users: {
        share_mode: "TEXT DEFAULT 'link'",
        share_token: 'TEXT',
        google_access_token: 'TEXT'
    },
    board_access: { board_id: 'INTEGER' },
    boards: {
        icon: "TEXT DEFAULT '📋'",
        share_mode: "TEXT DEFAULT 'link'",
        share_token: 'TEXT'
    },
    tasks: {
        user_id: 'INTEGER',
        board_id: 'INTEGER',
        column_id: 'INTEGER',
        telegram_message_id: 'INTEGER',
        images_json: 'TEXT',
        telegram_message_ids_json: 'TEXT',
        tags_json: 'TEXT',
        position: 'INTEGER DEFAULT 0',
        parent_id: 'INTEGER',
        group_id: 'TEXT',
        subtasks_json: 'TEXT',
        deleted_at: 'DATETIME'
    },
    tags: { user_id: 'INTEGER' }
};

const INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_boards_user ON boards(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_columns_board ON columns(board_id)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board_id)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_board_access_board ON board_access(board_id)',
    'CREATE INDEX IF NOT EXISTS idx_diagrams_user ON diagrams(user_id)'
];

async function addMissingColumns() {
    for (const [table, columns] of Object.entries(ADDED_COLUMNS)) {
        const existing = new Set((await db.all(`PRAGMA table_info(${table})`)).map(c => c.name));
        for (const [name, type] of Object.entries(columns)) {
            if (!existing.has(name)) {
                await db.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
            }
        }
    }
}

// Global Telegram settings used to be shared by every account. Hand them to
// the first account (the instance owner) so they stop leaking to other users.
async function migrateLegacySettings() {
    const owner = await db.get('SELECT id FROM users WHERE id = 1');
    if (!owner) return;
    await db.run(
        'INSERT OR IGNORE INTO user_settings (user_id, key, value) SELECT 1, key, value FROM settings'
    );
}

async function initSchema() {
    await db.run('PRAGMA journal_mode = WAL');
    await db.run('PRAGMA cache_size = -2000'); // ~2MB page cache
    await db.run('PRAGMA foreign_keys = ON');
    await db.run('PRAGMA busy_timeout = 10000'); // tolerate locks during redeploys

    for (const sql of TABLES) await db.run(sql);
    await addMissingColumns();
    for (const sql of INDEXES) await db.run(sql);
    await migrateLegacySettings();
}

module.exports = { initSchema };
