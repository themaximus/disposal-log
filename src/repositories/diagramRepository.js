const db = require('../db');

module.exports = {
    findByUserId(userId) {
        return db.all(
            'SELECT id, user_id, title, xml, created_at, updated_at FROM diagrams WHERE user_id = ? ORDER BY updated_at DESC',
            [userId]
        );
    },

    findOwned(id, userId) {
        return db.get('SELECT * FROM diagrams WHERE id = ? AND user_id = ?', [id, userId]);
    },

    async create(userId, title, xml) {
        const { lastID } = await db.run(
            'INSERT INTO diagrams (user_id, title, xml, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [userId, title, xml]
        );
        return lastID;
    },

    update(id, userId, title, xml) {
        return db.run(
            'UPDATE diagrams SET title = ?, xml = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            [title, xml, id, userId]
        );
    },

    delete(id, userId) {
        return db.run('DELETE FROM diagrams WHERE id = ? AND user_id = ?', [id, userId]);
    }
};
