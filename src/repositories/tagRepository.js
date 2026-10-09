const db = require('../db');

module.exports = {
    findByUserId(userId) {
        return db.all('SELECT * FROM tags WHERE user_id = ?', [userId]);
    },

    async create(userId, name, color) {
        const { lastID } = await db.run('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)', [userId, name, color]);
        return lastID;
    }
};
