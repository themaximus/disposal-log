const db = require('../../database');

class TaskRepository {
    static findById(id, callback) {
        db.get("SELECT * FROM tasks WHERE id = ?", [id], callback);
    }

    static findByBoardAndUser(boardId, userId, callback) {
        let query = "SELECT * FROM tasks WHERE (user_id = ? OR user_id IS NULL) AND deleted_at IS NULL ORDER BY position ASC, created_at DESC";
        let params = [userId || 1];

        if (boardId) {
            query = "SELECT * FROM tasks WHERE (user_id = ? OR user_id IS NULL) AND (board_id = ? OR board_id IS NULL) AND deleted_at IS NULL ORDER BY position ASC, created_at DESC";
            params = [userId || 1, boardId];
        }

        db.all(query, params, callback);
    }

    static findTrashByBoardAndUser(boardId, userId, callback) {
        let query = "SELECT * FROM tasks WHERE (user_id = ? OR user_id IS NULL) AND deleted_at IS NOT NULL";
        let params = [userId || 1];

        if (boardId) {
            query += " AND (board_id = ? OR board_id IS NULL)";
            params.push(boardId);
        }
        query += " ORDER BY deleted_at DESC";

        db.all(query, params, callback);
    }

    static create(taskData, callback) {
        const { userId, boardId, columnId, title, description, imagesJson, difficulty, tagsJson, status, position, parentId, groupId, subtasksJson } = taskData;
        db.run(
            `INSERT INTO tasks (user_id, board_id, column_id, title, description, images_json, difficulty, tags_json, status, position, parent_id, group_id, subtasks_json) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, boardId, columnId || null, title, description || '', imagesJson || '[]', difficulty || 1, tagsJson || '[]', status || 'todo', position || 9999, parentId || null, groupId || null, subtasksJson || '[]'],
            function (err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    static update(id, userId, taskData, callback) {
        const { title, description, imagesJson, difficulty, tagsJson, status, position, parentId, groupId, subtasksJson } = taskData;
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
                group_id = COALESCE(?, group_id),
                subtasks_json = COALESCE(?, subtasks_json)
             WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
            [title, description, imagesJson, difficulty, tagsJson, status, position, parentId, groupId, subtasksJson, id, userId],
            callback
        );
    }

    static updateSubtasks(id, userId, subtasksJson, callback) {
        db.run(
            "UPDATE tasks SET subtasks_json = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)",
            [subtasksJson, id, userId],
            callback
        );
    }

    static setGroupId(id, userId, groupId, status, callback) {
        if (status) {
            db.run(
                "UPDATE tasks SET group_id = ?, status = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)",
                [groupId, status, id, userId],
                callback
            );
        } else {
            db.run(
                "UPDATE tasks SET group_id = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)",
                [groupId, id, userId],
                callback
            );
        }
    }

    static unlinkGroup(groupId, userId, callback) {
        db.run(
            "UPDATE tasks SET group_id = NULL WHERE group_id = ? AND (user_id = ? OR user_id IS NULL)",
            [groupId, userId],
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
        db.run("UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [id, userId], callback);
    }

    static restore(id, userId, callback) {
        db.run("UPDATE tasks SET deleted_at = NULL WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [id, userId], callback);
    }

    static permanentDelete(id, userId, callback) {
        db.run("DELETE FROM tasks WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [id, userId], callback);
    }

    static emptyTrash(boardId, userId, callback) {
        let query = "DELETE FROM tasks WHERE (user_id = ? OR user_id IS NULL) AND deleted_at IS NOT NULL";
        let params = [userId];
        if (boardId) {
            query += " AND (board_id = ? OR board_id IS NULL)";
            params.push(boardId);
        }
        db.run(query, params, callback);
    }
}

module.exports = TaskRepository;
