const db = require('../../database');

class TaskRepository {
    static findById(id, callback) {
        db.get("SELECT * FROM tasks WHERE id = ?", [id], callback);
    }

    static findByBoardAndUser(boardId, userId, callback) {
        if (userId && boardId) {
            db.run("UPDATE tasks SET board_id = ? WHERE (user_id = ? OR user_id IS NULL) AND board_id IS NULL", [boardId, userId]);
        }

        let query = "SELECT * FROM tasks WHERE (user_id = 1 OR user_id IS NULL) ORDER BY status DESC, position ASC, created_at DESC";
        let params = [];

        if (userId) {
            if (boardId) {
                query = "SELECT * FROM tasks WHERE (user_id = ? OR user_id IS NULL) AND (board_id = ? OR board_id IS NULL) ORDER BY position ASC, created_at DESC";
                params = [userId, boardId];
            } else {
                query = "SELECT * FROM tasks WHERE user_id = ? ORDER BY position ASC, created_at DESC";
                params = [userId];
            }
        } else if (boardId) {
            query = "SELECT * FROM tasks WHERE (board_id = ? OR board_id IS NULL) ORDER BY position ASC, created_at DESC";
            params = [boardId];
        }

        db.all(query, params, callback);
    }

    static create(taskData, callback) {
        const { userId, boardId, columnId, title, description, imagesJson, difficulty, tagsJson, status, position, parentId } = taskData;
        db.run(
            `INSERT INTO tasks (user_id, board_id, column_id, title, description, images_json, difficulty, tags_json, status, position, parent_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, boardId, columnId || null, title, description || '', imagesJson || '[]', difficulty || 1, tagsJson || '[]', status || 'todo', position || 9999, parentId || null],
            function (err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    static update(id, userId, taskData, callback) {
        const { title, description, imagesJson, difficulty, tagsJson, status, position, parentId, groupId } = taskData;
        db.run(
            `UPDATE tasks SET 
                title = COALESCE(?, title), 
                description = COALESCE(?, description), 
                images_json = COALESCE(?, images_json), 
                difficulty = COALESCE(?, difficulty), 
                tags_json = COALESCE(?, tags_json), 
                status = COALESCE(?, status), 
                position = COALESCE(?, position), 
                parent_id = COALESCE(?, parent_id), 
                group_id = COALESCE(?, group_id) 
             WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
            [title, description, imagesJson, difficulty, tagsJson, status, position, parentId, groupId, id, userId],
            callback
        );
    }

    static updateStatus(id, userId, status, callback) {
        const completedAt = status === 'done' ? new Date().toISOString() : null;
        db.run(
            "UPDATE tasks SET status = ?, completed_at = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)",
            [status, completedAt, id, userId],
            callback
        );
    }

    static delete(id, userId, callback) {
        db.run("DELETE FROM tasks WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [id, userId], callback);
    }
}

module.exports = TaskRepository;
