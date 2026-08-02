const TaskRepository = require('../repositories/TaskRepository');

class TaskController {
    static getTasks(req, res) {
        const boardId = req.query.board_id;
        const userId = req.user ? req.user.id : null;

        TaskRepository.findByBoardAndUser(boardId, userId, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            rows = rows || [];
            rows.forEach(r => {
                if (r.images_json) { try { r.images = JSON.parse(r.images_json); } catch(e) { r.images = []; } }
                else if (r.image_url) { r.images = [r.image_url]; }
                else { r.images = []; }
                
                if (r.tags_json) { try { r.tags = JSON.parse(r.tags_json); } catch(e) { r.tags = []; } }
                else { r.tags = []; }
            });
            res.json(rows);
        });
    }

    static createTask(req, res) {
        const { title, description, difficulty, tags, parent_id, board_id, status } = req.body;
        const userId = req.user.id;
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(f => `/uploads/${f.filename}`);
        }
        const imagesJson = JSON.stringify(images);
        const tagsJson = tags || '[]';
        const initialStatus = status || (parent_id ? 'locked' : 'todo');

        TaskRepository.create({
            userId,
            boardId: board_id,
            title,
            description,
            imagesJson,
            difficulty: parseInt(difficulty) || 1,
            tagsJson,
            status: initialStatus,
            position: 9999,
            parentId: parent_id || null
        }, (err, taskId) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: taskId });
        });
    }

    static updateStatus(req, res) {
        const { status } = req.body;
        const taskId = req.params.id;
        TaskRepository.updateStatus(taskId, req.user.id, status, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }

    static deleteTask(req, res) {
        TaskRepository.delete(req.params.id, req.user.id, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }
}

module.exports = TaskController;
