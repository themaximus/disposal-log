const db = require('../db');

// Column rows are only reachable through a board the user owns.
const OWNED_COLUMN = 'id = ? AND board_id IN (SELECT id FROM boards WHERE user_id = ?)';

module.exports = {
    findByBoardId(boardId) {
        return db.all('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC', [boardId]);
    },

    async nextPosition(boardId) {
        const row = await db.get('SELECT MAX(position) AS maxPos FROM columns WHERE board_id = ?', [boardId]);
        return row && row.maxPos !== null ? row.maxPos + 1 : 0;
    },

    async create({ boardId, title, columnKey, color, position }) {
        const { lastID } = await db.run(
            'INSERT INTO columns (board_id, title, column_key, color, position) VALUES (?, ?, ?, ?, ?)',
            [boardId, title.trim(), columnKey, color || '#388bfd', position || 0]
        );
        return lastID;
    },

    update(id, userId, { title, color, position }) {
        return db.run(
            `UPDATE columns SET title = COALESCE(?, title), color = COALESCE(?, color), position = COALESCE(?, position)
             WHERE ${OWNED_COLUMN}`,
            [title ?? null, color ?? null, position ?? null, id, userId]
        );
    },

    updatePositions(userId, updates) {
        return db.transaction(async () => {
            for (const { id, position } of updates) {
                await db.run(`UPDATE columns SET position = ? WHERE ${OWNED_COLUMN}`, [position, id, userId]);
            }
        });
    },

    delete(id, userId) {
        return db.run(`DELETE FROM columns WHERE ${OWNED_COLUMN}`, [id, userId]);
    }
};
