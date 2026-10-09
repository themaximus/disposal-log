const db = require('../db');

module.exports = {
    async getAll(userId) {
        const rows = await db.all('SELECT key, value FROM user_settings WHERE user_id = ?', [userId]);
        return Object.fromEntries(rows.map(r => [r.key, r.value]));
    },

    setMany(userId, values) {
        return db.transaction(async () => {
            for (const [key, value] of Object.entries(values)) {
                await db.run(
                    `INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)
                     ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
                    [userId, key, value]
                );
            }
        });
    }
};
