const express = require('express');
const { attachUser } = require('../middleware/auth');
const { notFoundApi } = require('../middleware/errorHandler');

const api = express.Router();
api.use(attachUser);

api.use('/auth', require('./authRoutes'));
api.use('/upload', require('./uploadRoutes'));
api.use('/settings', require('./settingsRoutes'));
api.use('/backup', require('./backupRoutes'));
api.use('/tags', require('./tagRoutes'));
api.use('/boards', require('./boardRoutes'));
api.use('/columns', require('./columnRoutes'));
api.use('/tasks', require('./taskRoutes'));
api.use('/diagrams', require('./diagramRoutes'));
api.use('/public', require('./publicRoutes'));
api.use(notFoundApi);

// OAuth links were historically published without the /api prefix as well.
const legacyAuth = express.Router();
legacyAuth.use(attachUser);
legacyAuth.use(require('./authRoutes'));

module.exports = { api, legacyAuth };
