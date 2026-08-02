const db = require('../../database');

class ColumnRepository {
    static findByBoardId(boardId, callback) {
        db.all("SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC", [boardId], callback);
    }

    static create(columnData, callback) {
        const { boardId, title, columnKey, color, position } = columnData;
        db.run(
            "INSERT INTO columns (board_id, title, column_key, color, position) VALUES (?, ?, ?, ?, ?)",
            [boardId, title.trim(), columnKey, color || '#388bfd', position || 0],
            function (err) {
                callback(err, this ? this.lastID : null);
            }
        );
    }

    static update(id, updateData, callback) {
        const { title, color, position } = updateData;
        db.run(
            "UPDATE columns SET title = COALESCE(?, title), color = COALESCE(?, color), position = COALESCE(?, position) WHERE id = ?",
            [title, color, position, id],
            callback
        );
    }

    static delete(id, callback) {
        db.run("DELETE FROM columns WHERE id = ?", [id], callback);
    }
}

module.exports = ColumnRepository;
