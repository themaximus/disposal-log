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

                if (r.subtasks_json) { try { r.subtasks = JSON.parse(r.subtasks_json); } catch(e) { r.subtasks = []; } }
                else { r.subtasks = []; }
            });
            res.json(rows);
        });
    }

    static getTrash(req, res) {
        const boardId = req.query.board_id;
        const userId = req.user ? req.user.id : null;

        TaskRepository.findTrashByBoardAndUser(boardId, userId, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            rows = rows || [];
            rows.forEach(r => {
                if (r.images_json) { try { r.images = JSON.parse(r.images_json); } catch(e) { r.images = []; } }
                else if (r.image_url) { r.images = [r.image_url]; }
                else { r.images = []; }

                if (r.subtasks_json) { try { r.subtasks = JSON.parse(r.subtasks_json); } catch(e) { r.subtasks = []; } }
                else { r.subtasks = []; }
            });
            res.json(rows);
        });
    }

    static createTask(req, res) {
        const { title, description, difficulty, tags, images, parent_id, board_id, status, group_id, subtasks } = req.body;
        const userId = req.user.id;
        
        let finalImages = [];
        if (Array.isArray(images)) {
            finalImages = images;
        } else if (req.files && req.files.length > 0) {
            finalImages = req.files.map(f => `/uploads/${f.filename}`);
        }

        const imagesJson = JSON.stringify(finalImages);
        const tagsJson = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
        const subtasksJson = typeof subtasks === 'string' ? subtasks : JSON.stringify(subtasks || []);
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
            parentId: parent_id || null,
            groupId: group_id || null,
            subtasksJson
        }, (err, taskId) => {
            if (err) return res.status(500).json({ error: err.message });
            TaskRepository.findById(taskId, (err2, createdTask) => {
                if (createdTask) {
                    try { createdTask.images = JSON.parse(createdTask.images_json || '[]'); } catch(e) { createdTask.images = []; }
                    try { createdTask.subtasks = JSON.parse(createdTask.subtasks_json || '[]'); } catch(e) { createdTask.subtasks = []; }
                    res.json(createdTask);
                } else {
                    res.json({ success: true, id: taskId });
                }
            });
        });
    }

    static updateTask(req, res) {
        const taskId = req.params.id;
        const userId = req.user.id;
        const { title, description, difficulty, tags, images, status, group_id, subtasks } = req.body;

        const imagesJson = images ? JSON.stringify(images) : undefined;
        const tagsJson = tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : undefined;
        const subtasksJson = subtasks ? (typeof subtasks === 'string' ? subtasks : JSON.stringify(subtasks)) : undefined;

        TaskRepository.update(taskId, userId, {
            title,
            description,
            difficulty: difficulty ? parseInt(difficulty) : undefined,
            imagesJson,
            tagsJson,
            status,
            groupId: group_id,
            subtasksJson
        }, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }

    static updateSubtasks(req, res) {
        const taskId = req.params.id;
        const userId = req.user.id;
        const { subtasks } = req.body;
        const subtasksJson = JSON.stringify(subtasks || []);

        TaskRepository.updateSubtasks(taskId, userId, subtasksJson, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }

    static groupTask(req, res) {
        const taskId = parseInt(req.params.id);
        const { target_id } = req.body;
        const userId = req.user.id;

        TaskRepository.findById(target_id, (err, targetTask) => {
            if (err || !targetTask) return res.status(404).json({ error: 'Target task not found' });

            const groupId = targetTask.group_id || `group_${Date.now()}`;
            const targetStatus = targetTask.status;

            TaskRepository.setGroupId(target_id, userId, groupId, null, () => {
                TaskRepository.setGroupId(taskId, userId, groupId, targetStatus, (err2) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json({ success: true, group_id: groupId });
                });
            });
        });
    }

    static unlinkGroup(req, res) {
        const groupId = req.params.groupId;
        const userId = req.user.id;

        TaskRepository.unlinkGroup(groupId, userId, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
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

    static restoreTask(req, res) {
        TaskRepository.restore(req.params.id, req.user.id, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }

    static permanentDeleteTask(req, res) {
        TaskRepository.permanentDelete(req.params.id, req.user.id, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }

    static emptyTrash(req, res) {
        const boardId = req.body.board_id;
        TaskRepository.emptyTrash(boardId, req.user.id, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }
}

module.exports = TaskController;
