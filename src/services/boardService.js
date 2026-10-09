const crypto = require('crypto');
const db = require('../db');
const boardRepository = require('../repositories/boardRepository');
const columnRepository = require('../repositories/columnRepository');
const taskRepository = require('../repositories/taskRepository');
const { badRequest, notFound, forbidden } = require('../utils/errors');
const { serializeTask, toJsonArray } = require('../utils/serializers');

const SHARE_MODES = ['private', 'public', 'link', 'restricted'];

const DEFAULT_BOARD = { name: 'Основная доска', description: 'Главный бэклог проекта', icon: '📋' };

const DEFAULT_COLUMNS = [
    { title: 'Предстоящие', column_key: 'todo', color: '#f85149', position: 0 },
    { title: 'В работе', column_key: 'in_progress', color: '#d29922', position: 1 },
    { title: 'Реализованные', column_key: 'done', color: '#2ea043', position: 2 }
];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

async function requireOwnedBoard(boardId, userId) {
    const board = await boardRepository.findOwned(boardId, userId);
    if (!board) throw notFound('Доска не найдена');
    return board;
}

async function insertColumns(boardId, columns) {
    for (const col of columns) {
        await columnRepository.create({
            boardId,
            title: col.title || 'Колонка',
            columnKey: col.column_key,
            color: col.color,
            position: col.position
        });
    }
}

async function ensureDefaultColumns(boardId) {
    const existing = await columnRepository.findByBoardId(boardId);
    if (existing.length > 0) return existing;
    await insertColumns(boardId, DEFAULT_COLUMNS);
    return columnRepository.findByBoardId(boardId);
}

async function getUserBoards(userId) {
    if ((await boardRepository.countByUserId(userId)) === 0) {
        await createBoard(userId, DEFAULT_BOARD);
    }
    return boardRepository.findByUserId(userId);
}

async function createBoard(userId, { name, description, icon }) {
    if (!name || !String(name).trim()) throw badRequest('Укажите название доски');
    const board = await boardRepository.create({ userId, name: String(name), description, icon });
    const columns = await ensureDefaultColumns(board.id);
    return { ...board, columns };
}

async function updateBoard(boardId, userId, { name, description, icon }) {
    await boardRepository.update(boardId, userId, { name, description, icon });
}

async function deleteBoard(boardId, userId) {
    await boardRepository.deleteWithContents(boardId, userId);
}

// Converts a local (offline) board snapshot into a server board.
async function importBoard(userId, { board, columns, tasks }) {
    if (!board || !board.name) throw badRequest('Укажите данные доски');

    return db.transaction(async () => {
        const created = await boardRepository.create({ userId, name: board.name, description: board.description, icon: board.icon });
        await insertColumns(created.id, Array.isArray(columns) && columns.length > 0 ? columns : DEFAULT_COLUMNS);

        for (const task of Array.isArray(tasks) ? tasks : []) {
            await taskRepository.create({
                userId,
                boardId: created.id,
                title: task.title || 'Задача',
                description: task.description,
                status: task.status || 'todo',
                difficulty: task.difficulty,
                imageUrl: task.image_url,
                imagesJson: toJsonArray(task.images_json ?? task.images),
                subtasksJson: toJsonArray(task.subtasks_json ?? task.subtasks),
                tagsJson: toJsonArray(task.tags_json ?? task.tags),
                groupId: task.group_id
            });
        }
        return created.id;
    });
}

// --- Columns ----------------------------------------------------------------

async function getColumns(boardId, userId) {
    await requireOwnedBoard(boardId, userId);
    return ensureDefaultColumns(boardId);
}

async function createColumn(boardId, userId, { title, color }) {
    if (!title || !String(title).trim()) throw badRequest('Укажите название колонки');
    await requireOwnedBoard(boardId, userId);

    const column = {
        boardId,
        title: String(title).trim(),
        columnKey: `col_${Date.now()}_${Math.round(Math.random() * 1000)}`,
        color: color || '#388bfd',
        position: await columnRepository.nextPosition(boardId)
    };
    const id = await columnRepository.create(column);
    return { id, board_id: Number(boardId), title: column.title, column_key: column.columnKey, color: column.color, position: column.position };
}

// --- Sharing ----------------------------------------------------------------

function buildShareUrl(appUrl, board) {
    return board.share_mode === 'public'
        ? `${appUrl}/?share=${board.id}`
        : `${appUrl}/?share_token=${board.share_token}`;
}

async function getShareSettings(boardId, userId, appUrl) {
    const board = await requireOwnedBoard(boardId, userId);
    if (!board.share_token) {
        board.share_token = crypto.randomUUID();
        await boardRepository.update(board.id, userId, { shareToken: board.share_token });
    }
    board.share_mode = board.share_mode || 'link';

    return {
        boardId: board.id,
        shareMode: board.share_mode,
        shareToken: board.share_token,
        shareUrl: buildShareUrl(appUrl, board),
        invitedEmails: await boardRepository.getInvitedEmails(board.id)
    };
}

async function setShareMode(boardId, userId, shareMode) {
    if (!SHARE_MODES.includes(shareMode)) throw badRequest('Неверный режим доступа');
    await requireOwnedBoard(boardId, userId);
    await boardRepository.update(boardId, userId, { shareMode });
    return shareMode;
}

async function rotateShareToken(boardId, userId, appUrl) {
    await requireOwnedBoard(boardId, userId);
    const shareToken = crypto.randomUUID();
    await boardRepository.update(boardId, userId, { shareToken });
    return { shareToken, shareUrl: `${appUrl}/?share_token=${shareToken}` };
}

async function inviteEmail(boardId, userId, email) {
    const clean = normalizeEmail(email);
    if (!clean.includes('@')) throw badRequest('Укажите корректный E-mail');
    await requireOwnedBoard(boardId, userId);
    if (!(await boardRepository.hasAccess(boardId, clean))) {
        await boardRepository.addInvitedEmail(boardId, userId, clean);
    }
    return clean;
}

async function revokeEmail(boardId, userId, email) {
    const clean = normalizeEmail(email);
    if (!clean) throw badRequest('Укажите E-mail');
    await requireOwnedBoard(boardId, userId);
    await boardRepository.removeInvitedEmail(boardId, clean);
}

// Read-only board view for shared links, honoring the board's share mode.
async function getSharedBoard(identifier, { token, viewer }) {
    const board = await boardRepository.findByIdOrShareToken(identifier);
    if (!board) throw notFound('Доска не найдена');

    const isOwner = !!viewer && viewer.id === board.user_id;
    const mode = board.share_mode || 'link';

    if (!isOwner) {
        if (mode === 'private') {
            throw forbidden('Доска приватная. Владелец отключил доступ.');
        }
        if (mode === 'link' && identifier !== board.share_token && token !== board.share_token) {
            throw forbidden('Доступ возможен только по секретной ссылке.');
        }
        if (mode === 'restricted') {
            if (!viewer || !viewer.email) {
                throw forbidden('Доступ ограничен. Войдите под аккаунтом, которому предоставлен доступ.', { requireAuth: true });
            }
            const email = normalizeEmail(viewer.email);
            if (!(await boardRepository.hasAccess(board.id, email))) {
                throw forbidden(`У вашего аккаунта (${email}) нет доступа к этой доске.`);
            }
        }
    }

    const [columns, tasks] = await Promise.all([
        columnRepository.findByBoardId(board.id),
        taskRepository.findByBoardId(board.id)
    ]);
    const { share_token, ...publicBoard } = board;
    return { board: publicBoard, columns, tasks: tasks.map(serializeTask) };
}

module.exports = {
    getUserBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    importBoard,
    getColumns,
    createColumn,
    getShareSettings,
    setShareMode,
    rotateShareToken,
    inviteEmail,
    revokeEmail,
    getSharedBoard
};
