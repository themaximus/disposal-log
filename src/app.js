const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { api, legacyAuth } = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

function serveFrontend(app) {
    const indexPath = path.join(config.distDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.warn('Frontend build not found in dist/. Run "npm run build".');
        return;
    }

    app.use(express.static(config.distDir, {
        setHeaders: (res, filePath) => {
            res.setHeader('Cache-Control', filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=86400, immutable');
        }
    }));

    // SPA fallback for client-side routes.
    app.get('*splat', (req, res) => res.sendFile(indexPath));
}

function createApp() {
    const app = express();
    app.set('trust proxy', true);

    // Must answer instantly for the Railway health check.
    app.get('/health', (req, res) => res.status(200).send('OK'));

    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json({ limit: '10mb' }));
    app.use('/uploads', express.static(config.uploadsDir));

    app.use('/api', api);
    app.use('/auth', legacyAuth);

    serveFrontend(app);

    app.use(errorHandler);
    return app;
}

module.exports = { createApp };
