const express = require('express');
const tagRepository = require('../repositories/tagRepository');
const { requireUser } = require('../middleware/auth');
const { json, badRequest } = require('../utils/errors');

const router = express.Router();
router.use(requireUser);

router.get('/', json(req => tagRepository.findByUserId(req.user.id)));

router.post('/', json(async (req) => {
    const { name, color = '#3b82f6' } = req.body || {};
    if (!name) throw badRequest('Укажите название тега');
    const id = await tagRepository.create(req.user.id, name, color);
    return { id, name, color };
}));

module.exports = router;
