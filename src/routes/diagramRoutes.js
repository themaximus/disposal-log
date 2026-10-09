const express = require('express');
const diagramRepository = require('../repositories/diagramRepository');
const { requireUser } = require('../middleware/auth');
const { json, notFound } = require('../utils/errors');

const router = express.Router();

router.get('/', json(req => (req.user ? diagramRepository.findByUserId(req.user.id) : [])));

router.use(requireUser);

router.post('/', json(async (req, res) => {
    const { title, xml } = req.body || {};
    const diagramTitle = (title && title.trim()) || 'Новая диаграмма';
    const diagramXml = xml || '';
    const id = await diagramRepository.create(req.user.id, diagramTitle, diagramXml);
    const now = new Date().toISOString();
    res.status(201);
    return { id, user_id: req.user.id, title: diagramTitle, xml: diagramXml, created_at: now, updated_at: now };
}));

router.put('/:id', json(async (req) => {
    const existing = await diagramRepository.findOwned(req.params.id, req.user.id);
    if (!existing) throw notFound('Диаграмма не найдена');

    const { title = existing.title, xml = existing.xml } = req.body || {};
    await diagramRepository.update(existing.id, req.user.id, title, xml);
    return { success: true, id: existing.id, title, updated_at: new Date().toISOString() };
}));

router.delete('/:id', json(async (req) => {
    await diagramRepository.delete(req.params.id, req.user.id);
    return { success: true };
}));

module.exports = router;
