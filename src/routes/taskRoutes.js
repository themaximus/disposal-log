const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');

module.exports = function (sessionMiddleware, requireUser, upload) {
    router.get('/', sessionMiddleware, TaskController.getTasks);
    router.post('/', sessionMiddleware, requireUser, upload.array('images', 5), TaskController.createTask);
    router.put('/group/:groupId/unlink', sessionMiddleware, requireUser, TaskController.unlinkGroup);
    router.put('/:id/group', sessionMiddleware, requireUser, TaskController.groupTask);
    router.put('/:id/subtasks', sessionMiddleware, requireUser, TaskController.updateSubtasks);
    router.put('/:id/status', sessionMiddleware, requireUser, TaskController.updateStatus);
    router.put('/:id', sessionMiddleware, requireUser, upload.array('images', 5), TaskController.updateTask);
    router.delete('/:id', sessionMiddleware, requireUser, TaskController.deleteTask);

    return router;
};
