const ColumnRepository = require('../repositories/ColumnRepository');

class ColumnController {
    static getColumns(req, res) {
        const boardId = req.params.boardId;
        ColumnRepository.findByBoardId(boardId, (err, cols) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(cols || []);
        });
    }

    static createColumn(req, res) {
        const boardId = req.params.boardId;
        const { title, color } = req.body;
        if (!title || !title.trim()) return res.status(400).json({ error: 'Укажите название колонки' });

        const key = 'col_' + Date.now() + '_' + Math.round(Math.random() * 1000);
        ColumnRepository.findByBoardId(boardId, (err, cols) => {
            const nextPos = Array.isArray(cols) ? cols.length : 0;
            ColumnRepository.create({ boardId, title: title.trim(), columnKey: key, color: color || '#388bfd', position: nextPos }, (cErr, colId) => {
                if (cErr) return res.status(500).json({ error: cErr.message });
                res.json({ id: colId, board_id: boardId, title: title.trim(), column_key: key, color: color || '#388bfd', position: nextPos });
            });
        });
    }

    static updateColumn(req, res) {
        const colId = req.params.id;
        const { title, color, position } = req.body;
        ColumnRepository.update(colId, { title, color, position }, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }

    static updatePositions(req, res) {
        const { updates } = req.body;
        if (!Array.isArray(updates)) return res.status(400).json({ error: 'Укажите массив обновлений' });

        let done = 0;
        if (updates.length === 0) return res.json({ success: true });

        updates.forEach(u => {
            ColumnRepository.update(u.id, { position: u.position }, () => {
                done++;
                if (done === updates.length) {
                    res.json({ success: true });
                }
            });
        });
    }

    static deleteColumn(req, res) {
        const colId = req.params.id;
        ColumnRepository.delete(colId, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }
}

module.exports = ColumnController;
