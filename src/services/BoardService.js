const BoardRepository = require('../repositories/BoardRepository');
const ColumnRepository = require('../repositories/ColumnRepository');

class BoardService {
    static ensureDefaultBoardAndColumns(userId, callback) {
        BoardRepository.findDefaultBoard(userId, (err, board) => {
            if (err) return callback(err);
            if (board) {
                return BoardService.ensureDefaultColumns(board.id, (cErr, cols) => callback(null, board, cols));
            }

            BoardRepository.create(
                { userId, name: 'Основная доска', description: 'Главный бэклог проекта', icon: '📋' },
                (bErr, result) => {
                    if (bErr) return callback(bErr);
                    const newBoardId = result.id;
                    BoardService.ensureDefaultColumns(newBoardId, (cErr, cols) =>
                        callback(null, { id: newBoardId, name: 'Основная доска', description: 'Главный бэклог проекта', icon: '📋' }, cols)
                    );
                }
            );
        });
    }

    static ensureDefaultColumns(boardId, callback) {
        ColumnRepository.findByBoardId(boardId, (err, cols) => {
            if (!err && cols && cols.length > 0) {
                return callback(null, cols);
            }
            const defaultCols = [
                { title: 'Предстоящие', key: 'todo', color: '#f85149', pos: 0 },
                { title: 'В работе', key: 'in_progress', color: '#d29922', pos: 1 },
                { title: 'Реализованные', key: 'done', color: '#2ea043', pos: 2 }
            ];

            let completed = 0;
            defaultCols.forEach(c => {
                ColumnRepository.create(
                    { boardId, title: c.title, columnKey: c.key, color: c.color, position: c.pos },
                    () => {
                        completed++;
                        if (completed === defaultCols.length) {
                            ColumnRepository.findByBoardId(boardId, callback);
                        }
                    }
                );
            });
        });
    }

    static getUserBoards(userId, callback) {
        BoardService.ensureDefaultBoardAndColumns(userId, (err) => {
            if (err) return callback(err);
            BoardRepository.findByUserId(userId, callback);
        });
    }

    static createBoard(userId, data, callback) {
        BoardRepository.create({ userId, ...data }, (err, result) => {
            if (err) return callback(err);
            BoardService.ensureDefaultColumns(result.id, (cErr, cols) => {
                callback(null, { id: result.id, share_token: result.shareToken, columns: cols, ...data });
            });
        });
    }

    static updateBoard(boardId, userId, data, callback) {
        BoardRepository.update(boardId, userId, data, callback);
    }

    static deleteBoard(boardId, userId, callback) {
        BoardRepository.delete(boardId, userId, callback);
    }

    static getShareSettings(boardId, userId, appUrl, callback) {
        BoardRepository.findById(boardId, (err, board) => {
            if (err || !board) return callback(err || new Error('Доска не найдена'));
            if (board.user_id !== userId) return callback(new Error('Нет доступа'));

            const shareMode = board.share_mode || 'link';
            const token = board.share_token;
            let shareUrl = `${appUrl}/?share_token=${token}`;
            if (shareMode === 'public') {
                shareUrl = `${appUrl}/?share=${board.id}`;
            }

            BoardRepository.getInvitedEmails(boardId, (aErr, invitedEmails) => {
                callback(null, {
                    boardId: board.id,
                    shareMode,
                    shareToken: token,
                    shareUrl,
                    invitedEmails: invitedEmails || []
                });
            });
        });
    }
}

module.exports = BoardService;
