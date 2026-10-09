const express = require('express');
const googleDriveService = require('../services/googleDriveService');
const { json, badRequest } = require('../utils/errors');

const router = express.Router();

// Media lives on the user's own Google Drive; the browser uploads it directly.
// The server only cleans files up when they are removed from a task.
router.post(['/google-drive/delete', '/delete'], json(async (req) => {
    const { url } = req.body || {};
    if (!url) throw badRequest('URL файла не указан');

    const fileId = googleDriveService.extractFileId(url);
    if (!fileId) return { success: true, message: 'Не Google Drive файл' };
    if (!req.user || !req.user.google_access_token) return { success: true, message: 'Google токен отсутствует' };

    await googleDriveService.deleteFile(fileId, req.user.google_access_token);
    return { success: true, deletedFileId: fileId };
}));

module.exports = router;
