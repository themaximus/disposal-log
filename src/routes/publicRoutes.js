const express = require('express');
const boardService = require('../services/boardService');
const { json } = require('../utils/errors');

const router = express.Router();

// Shared board view: /api/public/board/:boardIdOrShareToken[?token=...]
router.get('/board/:identifier', json(req => boardService.getSharedBoard(req.params.identifier, {
    token: req.query.token,
    viewer: req.user
})));

module.exports = router;
