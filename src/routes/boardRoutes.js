const express = require('express');
const router = express.Router();
const BoardController = require('../controllers/BoardController');

module.exports = function (sessionMiddleware, requireUser, upload) {
    router.get('/', sessionMiddleware, requireUser, BoardController.getBoards);
    router.post('/', sessionMiddleware, requireUser, BoardController.createBoard);
    router.put('/:id', sessionMiddleware, requireUser, BoardController.updateBoard);
    router.post('/:id/icon', sessionMiddleware, requireUser, upload.single('icon'), BoardController.uploadIcon);
    router.delete('/:id', sessionMiddleware, requireUser, BoardController.deleteBoard);

    router.get('/:id/share', sessionMiddleware, requireUser, BoardController.getShareSettings);
    router.put('/:id/share/mode', sessionMiddleware, requireUser, BoardController.updateShareMode);
    router.post('/:id/share/invite', sessionMiddleware, requireUser, BoardController.addInviteEmail);
    router.delete('/:id/share/invite', sessionMiddleware, requireUser, BoardController.removeInviteEmail);

    return router;
};
