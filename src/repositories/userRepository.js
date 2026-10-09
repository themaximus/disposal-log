const db = require('../db');

module.exports = {
    findById(id) {
        return db.get('SELECT * FROM users WHERE id = ?', [id]);
    },

    findByProvider(provider, providerId) {
        return db.get('SELECT * FROM users WHERE provider = ? AND provider_id = ?', [provider, providerId]);
    },

    async create({ provider, providerId, email, name, avatarUrl, googleAccessToken }) {
        const { lastID } = await db.run(
            'INSERT INTO users (provider, provider_id, email, name, avatar_url, google_access_token) VALUES (?, ?, ?, ?, ?, ?)',
            [provider, providerId, email, name, avatarUrl, googleAccessToken || null]
        );
        return lastID;
    },

    updateProfile(id, { email, name, avatarUrl, googleAccessToken }) {
        return db.run(
            'UPDATE users SET email = ?, name = ?, avatar_url = ?, google_access_token = COALESCE(?, google_access_token) WHERE id = ?',
            [email, name, avatarUrl, googleAccessToken || null, id]
        );
    },

    setGoogleAccessToken(id, token) {
        return db.run('UPDATE users SET google_access_token = ? WHERE id = ?', [token, id]);
    },

    // Rows created before multi-user support belong to the instance owner.
    async adoptOrphanedRows(ownerId) {
        await db.run('UPDATE tasks SET user_id = ? WHERE user_id IS NULL', [ownerId]);
        await db.run('UPDATE tags SET user_id = ? WHERE user_id IS NULL', [ownerId]);
    }
};
