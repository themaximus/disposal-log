const express = require('express');
const router = express.Router();
const ColumnController = require('../controllers/ColumnController');

module.exports = function (sessionMiddleware, requireUser) {
    router.put('/positions', sessionMiddleware, requireUser, ColumnController.updatePositions);
    router.put('/:id', sessionMiddleware, requireUser, ColumnController.updateColumn);
    router.delete('/:id', sessionMiddleware, requireUser, ColumnController.deleteColumn);
    return router;
};
