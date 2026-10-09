require('dotenv').config({ quiet: true });
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
// Railway volume (or any persistent mount) keeps the DB and uploads across deploys.
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || rootDir;

const config = {
    port: Number(process.env.PORT) || 3000,
    rootDir,
    dataDir,
    dbPath: path.resolve(dataDir, 'database.sqlite'),
    uploadsDir: path.resolve(dataDir, 'uploads'),
    distDir: path.join(rootDir, 'dist'),
    telegramTemplatePath: path.join(rootDir, 'telegram_template.txt'),

    publicDomain: process.env.RAILWAY_PUBLIC_DOMAIN || null,
    appUrl: process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : null,

    github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    telegram: {
        botToken: process.env.BOT_TOKEN || '',
        channelId: process.env.CHANNEL_ID || ''
    },

    sessionTtlMs: 30 * 24 * 60 * 60 * 1000,
    sessionCleanupIntervalMs: 6 * 60 * 60 * 1000,
    trashRetentionDays: 30,
    trashPurgeIntervalMs: 24 * 60 * 60 * 1000,
    uploadMaxBytes: 50 * 1024 * 1024
};

for (const dir of [config.dataDir, config.uploadsDir]) {
    fs.mkdirSync(dir, { recursive: true });
}

module.exports = config;
