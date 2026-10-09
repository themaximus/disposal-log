const multer = require('multer');

function notFoundApi(req, res) {
    res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const status = err.status || (err instanceof multer.MulterError ? 400 : 500);
    if (status >= 500) console.error(`${req.method} ${req.originalUrl} failed:`, err);
    res.status(status).json({ error: err.message || 'Internal Server Error', ...(err.extra || {}) });
}

module.exports = { notFoundApi, errorHandler };
