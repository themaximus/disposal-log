const fs = require('fs');
const { Telegram } = require('telegraf');
const config = require('../config');
const settingsRepository = require('../repositories/settingsRepository');

function readDefaultTemplate() {
    try {
        return fs.readFileSync(config.telegramTemplatePath, 'utf8');
    } catch (e) {
        return '';
    }
}

async function getSettings(userId) {
    const stored = await settingsRepository.getAll(userId);
    return {
        botToken: stored.botToken || '',
        channelId: stored.channelId || '',
        telegramTemplate: stored.telegramTemplate || readDefaultTemplate(),
        isPublicBoard: stored.isPublicBoard !== '0'
    };
}

function saveSettings(userId, { botToken, channelId, telegramTemplate, isPublicBoard }) {
    return settingsRepository.setMany(userId, {
        botToken: botToken || '',
        channelId: channelId || '',
        telegramTemplate: telegramTemplate || '',
        isPublicBoard: isPublicBoard ? '1' : '0'
    });
}

// The user's own bot settings win; the server-wide .env values are a fallback.
async function sendTelegramMessage(userId, html) {
    const settings = await getSettings(userId);
    const botToken = settings.botToken || config.telegram.botToken;
    const channelId = settings.channelId || config.telegram.channelId;
    if (!botToken || !channelId) {
        const err = new Error('Бот не инициализирован. Проверьте Bot Token и Channel ID.');
        err.status = 400;
        throw err;
    }
    await new Telegram(botToken).sendMessage(channelId, html, { parse_mode: 'HTML' });
}

module.exports = { getSettings, saveSettings, sendTelegramMessage };
