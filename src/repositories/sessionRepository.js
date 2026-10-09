const db = require('../db');

module.exports = {
    create(token, userId, expiresAt) {
        return db.run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', [token, userId, expiresAt]);
    },

    findUserByToken(token) {
        return db.get(
            `SELECT s.expires_at, u.id, u.email, u.name, u.avatar_url, u.provider, u.google_access_token
             FROM sessions s JOIN users u ON s.user_id = u.id
             WHERE s.token = ?`,
            [token]
        );
    },

    delete(token) {
        return db.run('DELETE FROM sessions WHERE token = ?', [token]);
    },

    async deleteOthers(userId, keepToken) {
        const { changes } = await db.run('DELETE FROM sessions WHERE user_id = ? AND token != ?', [userId, keepToken || '']);
        return changes;
    },

    deleteExpired() {
        return db.run('DELETE FROM sessions WHERE expires_at <= ?', [new Date().toISOString()]);
    }
};
