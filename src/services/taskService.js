const taskRepository = require('../repositories/taskRepository');
const boardRepository = require('../repositories/boardRepository');
const { notFound } = require('../utils/errors');
const { serializeTask, toJsonArray } = require('../utils/serializers');

const toOptionalJson = (value) => (value === undefined || value === null ? undefined : toJsonArray(value));
const toDifficulty = (value) => parseInt(value, 10) || undefined;

async function listTasks(userId, boardId) {
    return (await taskRepository.findActive(userId, boardId)).map(serializeTask);
}

async function listTrash(userId, boardId) {
    return (await taskRepository.findTrash(userId, boardId)).map(serializeTask);
}

async function createTask(userId, body, uploadedFiles = []) {
    if (body.board_id && !(await boardRepository.findOwned(body.board_id, userId))) {
        throw notFound('Доска не найдена');
    }
    const images = Array.isArray(body.images) && body.images.length > 0
        ? body.images
        : uploadedFiles.map(f => `/uploads/${f.filename}`);

    const id = await taskRepository.create({
        userId,
        boardId: body.board_id,
        title: body.title,
        description: body.description,
        imagesJson: JSON.stringify(images),
        difficulty: toDifficulty(body.difficulty) || 1,
        tagsJson: toJsonArray(body.tags),
        status: body.status || (body.parent_id ? 'locked' : 'todo'),
        parentId: body.parent_id,
        groupId: body.group_id,
        subtasksJson: toJsonArray(body.subtasks)
    });
    return serializeTask(await taskRepository.findById(id));
}

async function updateTask(id, userId, body) {
    await taskRepository.update(id, userId, {
        title: body.title,
        description: body.description,
        difficulty: toDifficulty(body.difficulty),
        imagesJson: toOptionalJson(body.images),
        tagsJson: toOptionalJson(body.tags),
        status: body.status,
        groupId: body.group_id,
        subtasksJson: toOptionalJson(body.subtasks)
    });
}

function updateSubtasks(id, userId, subtasks) {
    return taskRepository.updateSubtasks(id, userId, toJsonArray(subtasks));
}

function updateStatus(id, userId, status) {
    return taskRepository.updateStatus(id, userId, status);
}

// Stacks a task onto a target task, creating the stack if needed.
async function groupWith(id, userId, targetId) {
    const target = await taskRepository.findOwned(targetId, userId);
    if (!target) throw notFound('Target task not found');

    const groupId = target.group_id || `group_${Date.now()}`;
    await taskRepository.setGroup(target.id, userId, groupId);
    await taskRepository.setGroup(id, userId, groupId, target.status);
    return groupId;
}

module.exports = {
    listTasks,
    listTrash,
    createTask,
    updateTask,
    updateSubtasks,
    updateStatus,
    groupWith,
    unlinkGroup: (groupId, userId) => taskRepository.unlinkGroup(groupId, userId),
    softDelete: (id, userId) => taskRepository.softDelete(id, userId),
    restore: (id, userId) => taskRepository.restore(id, userId),
    permanentDelete: (id, userId) => taskRepository.permanentDelete(id, userId),
    emptyTrash: (userId, boardId) => taskRepository.emptyTrash(userId, boardId)
};
