const express = require('express');
const settingsService = require('../services/settingsService');
const { requireUser } = require('../middleware/auth');
const { json } = require('../utils/errors');

const router = express.Router();
router.use(requireUser);

router.get('/', json(req => settingsService.getSettings(req.user.id)));

router.put('/', json(async (req) => {
    await settingsService.saveSettings(req.user.id, req.body || {});
    return { success: true };
}));

router.post('/test-telegram', json(async (req) => {
    try {
        await settingsService.sendTelegramMessage(
            req.user.id,
            '<b>🧪 PULSE Test Connection</b>\n\nТестовая связь с вашей Канбан-доской работает успешно!'
        );
    } catch (err) {
        if (!err.status) err.message = `Ошибка отправки в Telegram: ${err.message}`;
        throw err;
    }
    return { success: true };
}));

module.exports = router;
