const express = require('express');
const boardService = require('../services/boardService');
const upload = require('../middleware/upload');
const { requireUser } = require('../middleware/auth');
const { getAppUrl } = require('../utils/url');
const { json, badRequest } = require('../utils/errors');

const router = express.Router();
router.get('/', json(req => (req.user ? boardService.getUserBoards(req.user.id) : [])));

router.use(requireUser);

router.post('/', json(async (req) => {
    const board = await boardService.createBoard(req.user.id, req.body || {});
    return { success: true, ...board };
}));

router.post('/import', json(async (req) => {
    const boardId = await boardService.importBoard(req.user.id, req.body || {});
    return { success: true, boardId };
}));

router.put('/:id', json(async (req) => {
    await boardService.updateBoard(req.params.id, req.user.id, req.body || {});
    return { success: true };
}));

router.post('/:id/icon', upload.single('icon'), json(async (req) => {
    if (!req.file) throw badRequest('Файл иконки не выбран');
    const icon = `/uploads/${req.file.filename}`;
    await boardService.updateBoard(req.params.id, req.user.id, { icon });
    return { success: true, icon };
}));

router.delete('/:id', json(async (req) => {
    await boardService.deleteBoard(req.params.id, req.user.id);
    return { success: true };
}));

// --- Columns ----------------------------------------------------------------

router.get('/:id/columns', json(req => boardService.getColumns(req.params.id, req.user.id)));

router.post('/:id/columns', json(req => boardService.createColumn(req.params.id, req.user.id, req.body || {})));

// --- Sharing ----------------------------------------------------------------

router.get('/:id/share', json(req => boardService.getShareSettings(req.params.id, req.user.id, getAppUrl(req))));

router.put('/:id/share/mode', json(async (req) => {
    const shareMode = await boardService.setShareMode(req.params.id, req.user.id, (req.body || {}).shareMode);
    return { success: true, shareMode };
}));

router.post('/:id/share/rotate-token', json(async (req) => {
    const result = await boardService.rotateShareToken(req.params.id, req.user.id, getAppUrl(req));
    return { success: true, ...result };
}));

router.post('/:id/share/invite', json(async (req) => {
    const email = await boardService.inviteEmail(req.params.id, req.user.id, (req.body || {}).email);
    return { success: true, email };
}));

router.delete('/:id/share/invite', json(async (req) => {
    await boardService.revokeEmail(req.params.id, req.user.id, (req.body || {}).email);
    return { success: true };
}));

module.exports = router;
