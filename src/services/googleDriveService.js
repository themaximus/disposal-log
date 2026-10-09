const { fetchJson } = require('../utils/http');

function extractFileId(url) {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

function deleteFile(fileId, accessToken) {
    return fetchJson(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
    });
}

module.exports = { extractFileId, deleteFile };
