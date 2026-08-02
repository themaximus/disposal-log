const db = require('../../database');
const crypto = require('crypto');

class BoardRepository {
    static findById(id, callback) {
        db.get("SELECT * FROM boards WHERE id = ?", [id], callback);
    }

    static findByShareToken(token, callback) {
        db.get("SELECT * FROM boards WHERE share_token = ?", [token], callback);
    }

    static findByUserId(userId, callback) {
        db.all("SELECT * FROM boards WHERE user_id = ? ORDER BY id ASC", [userId], callback);
    }

    static findDefaultBoard(userId, callback) {
        db.get("SELECT * FROM boards WHERE user_id = ? ORDER BY id ASC LIMIT 1", [userId], callback);
    }

    static create(boardData, callback) {
        const { userId, name, description, icon } = boardData;
        const shareToken = crypto.randomUUID();
        db.run(
            "INSERT INTO boards (user_id, name, description, icon, share_mode, share_token) VALUES (?, ?, ?, ?, 'link', ?)",
            [userId, name.trim(), description || '', icon || '📋', shareToken],
            function (err) {
                callback(err, this ? { id: this.lastID, shareToken } : null);
            }
        );
    }

    static update(id, userId, updateData, callback) {
        const { name, description, icon, shareMode, shareToken } = updateData;
        db.run(
            "UPDATE boards SET name = COALESCE(?, name), description = COALESCE(?, description), icon = COALESCE(?, icon), share_mode = COALESCE(?, share_mode), share_token = COALESCE(?, share_token) WHERE id = ? AND user_id = ?",
            [name, description, icon, shareMode, shareToken, id, userId],
            callback
        );
    }

    static delete(id, userId, callback) {
        db.run("DELETE FROM boards WHERE id = ? AND user_id = ?", [id, userId], function (err) {
            if (!err) {
                db.run("DELETE FROM columns WHERE board_id = ?", [id]);
                db.run("DELETE FROM tasks WHERE board_id = ?", [id]);
                db.run("DELETE FROM board_access WHERE board_id = ?", [id]);
            }
            callback(err);
        });
    }

    static getInvitedEmails(boardId, callback) {
        db.all("SELECT granted_email FROM board_access WHERE board_id = ?", [boardId], (err, rows) => {
            if (err) return callback(err);
            callback(null, rows ? rows.map(r => r.granted_email) : []);
        });
    }

    static addInvitedEmail(boardId, ownerId, email, callback) {
        db.run(
            "INSERT INTO board_access (board_id, owner_id, granted_email) VALUES (?, ?, ?)",
            [boardId, ownerId, email.trim().toLowerCase()],
            callback
        );
    }

    static removeInvitedEmail(boardId, email, callback) {
        db.run(
            "DELETE FROM board_access WHERE board_id = ? AND granted_email = ?",
            [boardId, email.trim().toLowerCase()],
            callback
        );
    }
}

module.exports = BoardRepository;
