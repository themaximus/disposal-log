const express = require('express');
const taskService = require('../services/taskService');
const upload = require('../middleware/upload');
const { requireUser } = require('../middleware/auth');
const { json, badRequest } = require('../utils/errors');

const router = express.Router();

// Guests work with local (offline) boards only.
router.get('/', json(req => (req.user ? taskService.listTasks(req.user.id, req.query.board_id) : [])));

router.use(requireUser);

router.get('/trash', json(req => taskService.listTrash(req.user.id, req.query.board_id)));

router.post('/trash/empty', json(async (req) => {
    const count = await taskService.emptyTrash(req.user.id, (req.body || {}).board_id);
    return { success: true, count };
}));

router.post('/', upload.array('images', 5), json(req => taskService.createTask(req.user.id, req.body || {}, req.files)));

router.put('/group/:groupId/unlink', json(async (req) => {
    await taskService.unlinkGroup(req.params.groupId, req.user.id);
    return { success: true };
}));

router.put('/:id', json(async (req) => {
    await taskService.updateTask(req.params.id, req.user.id, req.body || {});
    return { success: true };
}));

router.put('/:id/group', json(async (req) => {
    const { target_id: targetId } = req.body || {};
    if (!targetId) throw badRequest('target_id is required');
    const groupId = await taskService.groupWith(req.params.id, req.user.id, targetId);
    return { success: true, group_id: groupId };
}));

router.put('/:id/subtasks', json(async (req) => {
    await taskService.updateSubtasks(req.params.id, req.user.id, (req.body || {}).subtasks);
    return { success: true };
}));

router.put('/:id/status', json(async (req) => {
    const { status } = req.body || {};
    if (!status) throw badRequest('status is required');
    await taskService.updateStatus(req.params.id, req.user.id, status);
    return { success: true };
}));

router.put('/:id/restore', json(async (req) => {
    await taskService.restore(req.params.id, req.user.id);
    return { success: true };
}));

router.delete('/:id', json(async (req) => {
    await taskService.softDelete(req.params.id, req.user.id);
    return { success: true };
}));

router.delete('/:id/permanent', json(async (req) => {
    await taskService.permanentDelete(req.params.id, req.user.id);
    return { success: true };
}));

module.exports = router;
