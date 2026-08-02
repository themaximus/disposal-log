const db = require('../../database');

class UserRepository {
    static findById(id, callback) {
        db.get("SELECT * FROM users WHERE id = ?", [id], callback);
    }

    static findByShareToken(token, callback) {
        db.get("SELECT * FROM users WHERE share_token = ?", [token], callback);
    }

    static findByProvider(provider, providerId, callback) {
        db.get("SELECT * FROM users WHERE provider = ? AND provider_id = ?", [provider, providerId], callback);
    }

    static create(userData, callback) {
        const { provider, providerId, email, name, avatarUrl, shareToken } = userData;
        db.run(
            `INSERT INTO users (provider, provider_id, email, name, avatar_url, share_mode, share_token) VALUES (?, ?, ?, ?, ?, 'link', ?)`,
            [provider, providerId, email, name, avatarUrl, shareToken],
            function (err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    static update(id, updateData, callback) {
        const { name, email, avatarUrl, shareMode, shareToken } = updateData;
        db.run(
            `UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), avatar_url = COALESCE(?, avatar_url), share_mode = COALESCE(?, share_mode), share_token = COALESCE(?, share_token) WHERE id = ?`,
            [name, email, avatarUrl, shareMode, shareToken, id],
            callback
        );
    }

    static createSession(token, userId, expiresAt, callback) {
        db.run(
            `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`,
            [token, userId, expiresAt],
            callback
        );
    }

    static findSession(token, callback) {
        db.get(
            `SELECT s.*, u.id as user_id, u.email, u.name, u.avatar_url, u.provider, u.share_mode, u.share_token FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP`,
            [token],
            callback
        );
    }

    static deleteSession(token, callback) {
        db.run(`DELETE FROM sessions WHERE token = ?`, [token], callback);
    }

    static deleteOtherSessions(userId, currentToken, callback) {
        db.run(
            `DELETE FROM sessions WHERE user_id = ? AND token != ?`,
            [userId, currentToken],
            function (err) {
                callback(err, this ? this.changes : 0);
            }
        );
    }
}

module.exports = UserRepository;
