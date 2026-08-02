const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');

module.exports = function (sessionMiddleware, requireUser, upload) {
    router.get('/', sessionMiddleware, TaskController.getTasks);
    router.post('/', sessionMiddleware, requireUser, upload.array('images', 5), TaskController.createTask);
    router.put('/:id/status', sessionMiddleware, requireUser, TaskController.updateStatus);
    router.delete('/:id', sessionMiddleware, requireUser, TaskController.deleteTask);

    return router;
};
