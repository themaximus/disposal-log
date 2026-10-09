const db = require('../db');

// Tasks without an owner predate multi-user support and stay visible to everyone.
const OWNED = '(user_id = ? OR user_id IS NULL)';
const IN_BOARD = '(board_id = ? OR board_id IS NULL)';

module.exports = {
    findById(id) {
        return db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    },

    findOwned(id, userId) {
        return db.get(`SELECT * FROM tasks WHERE id = ? AND ${OWNED}`, [id, userId]);
    },

    findActive(userId, boardId) {
        const params = [userId];
        let where = `${OWNED} AND deleted_at IS NULL`;
        if (boardId) {
            where += ` AND ${IN_BOARD}`;
            params.push(boardId);
        }
        return db.all(`SELECT * FROM tasks WHERE ${where} ORDER BY position ASC, created_at DESC`, params);
    },

    findByBoardId(boardId) {
        return db.all('SELECT * FROM tasks WHERE board_id = ? AND deleted_at IS NULL ORDER BY position ASC, created_at DESC', [boardId]);
    },

    findByUserId(userId) {
        return db.all('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    },

    findTrash(userId, boardId) {
        const params = [userId];
        let where = `${OWNED} AND deleted_at IS NOT NULL`;
        if (boardId) {
            where += ` AND ${IN_BOARD}`;
            params.push(boardId);
        }
        return db.all(`SELECT * FROM tasks WHERE ${where} ORDER BY deleted_at DESC`, params);
    },

    async create(task) {
        const { lastID } = await db.run(
            `INSERT INTO tasks (user_id, board_id, column_id, title, description, image_url, images_json, difficulty,
                                tags_json, status, position, parent_id, group_id, subtasks_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                task.userId, task.boardId || null, task.columnId || null, task.title, task.description || '',
                task.imageUrl || '', task.imagesJson || '[]', task.difficulty || 1, task.tagsJson || '[]',
                task.status || 'todo', task.position ?? 9999, task.parentId || null, task.groupId || null,
                task.subtasksJson || '[]'
            ]
        );
        return lastID;
    },

    // Undefined fields are left untouched.
    update(id, userId, fields) {
        return db.run(
            `UPDATE tasks SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                images_json = COALESCE(?, images_json),
                difficulty = COALESCE(?, difficulty),
                tags_json = COALESCE(?, tags_json),
                status = COALESCE(?, status),
                group_id = COALESCE(?, group_id),
                subtasks_json = COALESCE(?, subtasks_json)
             WHERE id = ? AND ${OWNED}`,
            [
                fields.title ?? null, fields.description ?? null, fields.imagesJson ?? null, fields.difficulty ?? null,
                fields.tagsJson ?? null, fields.status ?? null, fields.groupId ?? null, fields.subtasksJson ?? null,
                id, userId
            ]
        );
    },

    updateSubtasks(id, userId, subtasksJson) {
        return db.run(`UPDATE tasks SET subtasks_json = ? WHERE id = ? AND ${OWNED}`, [subtasksJson, id, userId]);
    },

    updateStatus(id, userId, status) {
        const completedAt = status === 'done' ? new Date().toISOString() : null;
        return db.run(
            `UPDATE tasks SET status = ?, completed_at = ? WHERE id = ? AND ${OWNED}`,
            [status, completedAt, id, userId]
        );
    },

    setGroup(id, userId, groupId, status = null) {
        return db.run(
            `UPDATE tasks SET group_id = ?, status = COALESCE(?, status) WHERE id = ? AND ${OWNED}`,
            [groupId, status, id, userId]
        );
    },

    unlinkGroup(groupId, userId) {
        return db.run(`UPDATE tasks SET group_id = NULL WHERE group_id = ? AND ${OWNED}`, [groupId, userId]);
    },

    softDelete(id, userId) {
        return db.run(`UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND ${OWNED}`, [id, userId]);
    },

    restore(id, userId) {
        return db.run(`UPDATE tasks SET deleted_at = NULL WHERE id = ? AND ${OWNED}`, [id, userId]);
    },

    permanentDelete(id, userId) {
        return db.run(`DELETE FROM tasks WHERE id = ? AND ${OWNED}`, [id, userId]);
    },

    async emptyTrash(userId, boardId) {
        const params = [userId];
        let where = `${OWNED} AND deleted_at IS NOT NULL`;
        if (boardId) {
            where += ` AND ${IN_BOARD}`;
            params.push(boardId);
        }
        const { changes } = await db.run(`DELETE FROM tasks WHERE ${where}`, params);
        return changes;
    },

    async purgeDeletedBefore(days) {
        const { changes } = await db.run(
            "DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', ?)",
            [`-${days} days`]
        );
        return changes;
    }
};
