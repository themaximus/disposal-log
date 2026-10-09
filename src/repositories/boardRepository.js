const crypto = require('crypto');
const db = require('../db');

module.exports = {
    findById(id) {
        return db.get('SELECT * FROM boards WHERE id = ?', [id]);
    },

    findOwned(id, userId) {
        return db.get('SELECT * FROM boards WHERE id = ? AND user_id = ?', [id, userId]);
    },

    findByIdOrShareToken(identifier) {
        return db.get('SELECT * FROM boards WHERE id = ? OR share_token = ?', [identifier, identifier]);
    },

    findByUserId(userId) {
        return db.all('SELECT * FROM boards WHERE user_id = ? ORDER BY id ASC', [userId]);
    },

    countByUserId(userId) {
        return db.get('SELECT COUNT(*) AS count FROM boards WHERE user_id = ?', [userId]).then(r => r.count);
    },

    async create({ userId, name, description, icon }) {
        const shareToken = crypto.randomUUID();
        const { lastID } = await db.run(
            "INSERT INTO boards (user_id, name, description, icon, share_mode, share_token) VALUES (?, ?, ?, ?, 'link', ?)",
            [userId, name.trim(), description || '', icon || '📋', shareToken]
        );
        return this.findById(lastID);
    },

    update(id, userId, { name, description, icon, shareMode, shareToken }) {
        return db.run(
            `UPDATE boards SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                icon = COALESCE(?, icon),
                share_mode = COALESCE(?, share_mode),
                share_token = COALESCE(?, share_token)
             WHERE id = ? AND user_id = ?`,
            [name ?? null, description ?? null, icon ?? null, shareMode ?? null, shareToken ?? null, id, userId]
        );
    },

    deleteWithContents(id, userId) {
        return db.transaction(async () => {
            const { changes } = await db.run('DELETE FROM boards WHERE id = ? AND user_id = ?', [id, userId]);
            if (!changes) return false;
            await db.run('DELETE FROM columns WHERE board_id = ?', [id]);
            await db.run('DELETE FROM tasks WHERE board_id = ?', [id]);
            await db.run('DELETE FROM board_access WHERE board_id = ?', [id]);
            return true;
        });
    },

    async getInvitedEmails(boardId) {
        const rows = await db.all('SELECT granted_email FROM board_access WHERE board_id = ?', [boardId]);
        return rows.map(r => r.granted_email);
    },

    async hasAccess(boardId, email) {
        return !!(await db.get('SELECT id FROM board_access WHERE board_id = ? AND granted_email = ?', [boardId, email]));
    },

    addInvitedEmail(boardId, ownerId, email) {
        return db.run('INSERT INTO board_access (board_id, owner_id, granted_email) VALUES (?, ?, ?)', [boardId, ownerId, email]);
    },

    removeInvitedEmail(boardId, email) {
        return db.run('DELETE FROM board_access WHERE board_id = ? AND granted_email = ?', [boardId, email]);
    }
};
