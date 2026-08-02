const db = require('../../database');

class TaskRepository {
    static findById(id, callback) {
        db.get("SELECT * FROM tasks WHERE id = ?", [id], callback);
    }

    static findByBoardAndUser(boardId, userId, callback) {
        if (!userId) {
            return callback(null, []);
        }

        let query = "SELECT * FROM tasks WHERE user_id = ? ORDER BY position ASC, created_at DESC";
        let params = [userId];

        if (boardId) {
            query = "SELECT * FROM tasks WHERE user_id = ? AND board_id = ? ORDER BY position ASC, created_at DESC";
            params = [userId, boardId];
        }

        db.all(query, params, callback);
    }

    static create(taskData, callback) {
        const { userId, boardId, columnId, title, description, imagesJson, difficulty, tagsJson, status, position, parentId, groupId } = taskData;
        db.run(
            `INSERT INTO tasks (user_id, board_id, column_id, title, description, images_json, difficulty, tags_json, status, position, parent_id, group_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, boardId, columnId || null, title, description || '', imagesJson || '[]', difficulty || 1, tagsJson || '[]', status || 'todo', position || 9999, parentId || null, groupId || null],
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
             WHERE id = ? AND user_id = ?`,
            [title, description, imagesJson, difficulty, tagsJson, status, position, parentId, groupId, id, userId],
            callback
        );
    }

    static setGroupId(id, userId, groupId, status, callback) {
        if (status) {
            db.run(
                "UPDATE tasks SET group_id = ?, status = ? WHERE id = ? AND user_id = ?",
                [groupId, status, id, userId],
                callback
            );
        } else {
            db.run(
                "UPDATE tasks SET group_id = ? WHERE id = ? AND user_id = ?",
                [groupId, id, userId],
                callback
            );
        }
    }

    static unlinkGroup(groupId, userId, callback) {
        db.run(
            "UPDATE tasks SET group_id = NULL WHERE group_id = ? AND user_id = ?",
            [groupId, userId],
            callback
        );
    }

    static updateStatus(id, userId, status, callback) {
        const completedAt = status === 'done' ? new Date().toISOString() : null;
        db.run(
            "UPDATE tasks SET status = ?, completed_at = ? WHERE id = ? AND user_id = ?",
            [status, completedAt, id, userId],
            callback
        );
    }

    static delete(id, userId, callback) {
        db.run("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, userId], callback);
    }
}

module.exports = TaskRepository;
