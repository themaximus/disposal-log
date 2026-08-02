const BoardService = require('../services/BoardService');
const BoardRepository = require('../repositories/BoardRepository');

class BoardController {
    static getBoards(req, res) {
        if (!req.user) {
            return res.json([]);
        }
        BoardService.getUserBoards(req.user.id, (err, boards) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(boards || []);
        });
    }

    static createBoard(req, res) {
        const { name, description, icon } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Укажите название доски' });

        BoardService.createBoard(req.user.id, { name, description, icon }, (err, board) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, ...board });
        });
    }

    static updateBoard(req, res) {
        BoardService.updateBoard(req.params.id, req.user.id, req.body, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }

    static uploadIcon(req, res) {
        if (!req.file) return res.status(400).json({ error: 'Файл иконки не выбран' });
        const iconUrl = `/uploads/${req.file.filename}`;
        BoardService.updateBoard(req.params.id, req.user.id, { icon: iconUrl }, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, icon: iconUrl });
        });
    }

    static deleteBoard(req, res) {
        BoardService.deleteBoard(req.params.id, req.user.id, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }

    static getShareSettings(req, res) {
        const getAppUrl = (req) => `${req.protocol}://${req.get('host')}`;
        BoardService.getShareSettings(req.params.id, req.user.id, getAppUrl(req), (err, data) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(data);
        });
    }

    static updateShareMode(req, res) {
        const { shareMode } = req.body;
        const allowedModes = ['private', 'public', 'link', 'restricted'];
        if (!allowedModes.includes(shareMode)) return res.status(400).json({ error: 'Неверный режим доступа' });

        BoardRepository.update(req.params.id, req.user.id, { shareMode }, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, shareMode });
        });
    }

    static addInviteEmail(req, res) {
        const { email } = req.body;
        if (!email || !email.includes('@')) return res.status(400).json({ error: 'Укажите корректный E-mail' });

        BoardRepository.addInvitedEmail(req.params.id, req.user.id, email, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, email });
        });
    }

    static removeInviteEmail(req, res) {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Укажите E-mail' });

        BoardRepository.removeInvitedEmail(req.params.id, email, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }
}

module.exports = BoardController;
