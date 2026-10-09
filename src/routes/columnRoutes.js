const express = require('express');
const columnRepository = require('../repositories/columnRepository');
const { requireUser } = require('../middleware/auth');
const { json, badRequest } = require('../utils/errors');

const router = express.Router();
router.use(requireUser);

router.put('/positions', json(async (req) => {
    const { updates } = req.body || {};
    if (!Array.isArray(updates)) throw badRequest('Укажите массив обновлений');
    await columnRepository.updatePositions(req.user.id, updates);
    return { success: true };
}));

router.put('/:id', json(async (req) => {
    const { title, color, position } = req.body || {};
    await columnRepository.update(req.params.id, req.user.id, { title, color, position });
    return { success: true };
}));

router.delete('/:id', json(async (req) => {
    await columnRepository.delete(req.params.id, req.user.id);
    return { success: true };
}));

module.exports = router;
