require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const db = require('./database');
const { Telegraf } = require('telegraf');

const app = express();
const port = process.env.PORT || 3000;

// Railway Volume / Data Directory Support
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || __dirname;
const uploadsDir = path.resolve(dataDir, 'uploads');
const backupsDir = path.resolve(dataDir, 'backups');

if (!fs.existsSync(uploadsDir)) { try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch(e){} }
if (!fs.existsSync(backupsDir)) { try { fs.mkdirSync(backupsDir, { recursive: true }); } catch(e){} }

// Helper Functions
function getAppUrl(req) {
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    if (process.env.APP_URL) {
        return process.env.APP_URL.replace(/\/$/, '');
    }
    const host = req.headers.host || `localhost:${port}`;
    const proto = req.headers['x-forwarded-proto'] || 'http';
    return `${proto}://${host}`;
}

function parseCookies(req) {
    const list = {};
    const rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
        });
    }
    return list;
}

function fetchJson(url, options = {}, postData = null) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = https.request(u, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        req.end();
    });
}

function createOrGetUser(provider, providerId, email, name, avatarUrl, googleAccessToken, callback) {
    if (typeof googleAccessToken === 'function') {
        callback = googleAccessToken;
        googleAccessToken = null;
    }
    db.get(`SELECT * FROM users WHERE provider = ? AND provider_id = ?`, [provider, providerId], (err, row) => {
        if (err) return callback(err);
        const handleUser = (user) => {
            if (user.id === 1) {
                db.run(`UPDATE tasks SET user_id = 1 WHERE user_id IS NULL`, () => {});
                db.run(`UPDATE tags SET user_id = 1 WHERE user_id IS NULL`, () => {});
            }
            callback(null, user);
        };

        if (row) {
            db.run(`UPDATE users SET email = ?, name = ?, avatar_url = ?, google_access_token = COALESCE(?, google_access_token) WHERE id = ?`,
                [email, name, avatarUrl, googleAccessToken, row.id], () => {
                handleUser({ ...row, email, name, avatar_url: avatarUrl, google_access_token: googleAccessToken || row.google_access_token });
            });
        } else {
            db.run(`INSERT INTO users (provider, provider_id, email, name, avatar_url, google_access_token) VALUES (?, ?, ?, ?, ?, ?)`,
                [provider, providerId, email, name, avatarUrl, googleAccessToken], function(err2) {
                    if (err2) return callback(err2);
                    handleUser({ id: this.lastID, provider, provider_id: providerId, email, name, avatar_url: avatarUrl, google_access_token: googleAccessToken });
                }
            );
        }
    });
}

function createSession(userId, callback) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.run(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`, [token, userId, expiresAt], (err) => {
        if (err) return callback(err);
        callback(null, token);
    });
}

function sessionMiddleware(req, res, next) {
    const cookies = parseCookies(req);
    const token = cookies.session_token || req.headers['x-session-token'] || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
    
    if (!token) {
        req.user = null;
        return next();
    }

    db.get(`SELECT s.token, s.expires_at, u.id, u.email, u.name, u.avatar_url, u.provider FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?`, [token], (err, row) => {
        if (err || !row || new Date(row.expires_at) < new Date()) {
            req.user = null;
        } else {
            req.user = {
                id: row.id,
                email: row.email,
                name: row.name,
                avatar_url: row.avatar_url,
                provider: row.provider
            };
        }
        next();
    });
}

function requireUser(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Авторизуйтесь через Google или GitHub' });
    }
    next();
}

// Telegram Bot setup
let botToken = process.env.BOT_TOKEN;
let channelId = process.env.CHANNEL_ID;
let bot = null;

function initBot() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split(/\r?\n/);
            lines.forEach(line => {
                const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                    const key = match[1];
                    let value = match[2] || '';
                    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                    
                    if (key === 'BOT_TOKEN') botToken = value.trim();
                    if (key === 'CHANNEL_ID') channelId = value.trim();
                }
            });
        } catch (e) {
            console.error('Error reading .env for bot init:', e);
        }
    }
    
    if (botToken) {
        try {
            bot = new Telegraf(botToken);
            console.log('Telegram Bot initialized with token:', botToken.substring(0, 10) + '...');
        } catch (e) {
            console.error('Failed to initialize Telegraf bot:', e.message);
            bot = null;
        }
    } else {
        bot = null;
        console.log('Telegram Bot disabled (no BOT_TOKEN found).');
    }
}
initBot();

// Express Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Multer setup with MIME validation
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        const allowedMime = /image\/(png|jpeg|jpg|webp|gif)|video\/(mp4|webm|quicktime)/;
        const allowedExt = /\.(png|jpeg|jpg|webp|gif|mp4|webm|mov)$/i;
        if (allowedMime.test(file.mimetype) && allowedExt.test(path.extname(file.originalname))) {
            return cb(null, true);
        }
        cb(new Error('Загрузка отклонена: разрешены только изображения (PNG, JPG, WEBP, GIF) и видео (MP4, WEBM, MOV).'));
    }
});

// Standalone Media Upload API Endpoint
app.post('/api/upload', sessionMiddleware, requireUser, upload.array('images', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Файлы не загружены' });
    }
    const urls = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ success: true, urls });
});

// Periodic Cleanup of Expired Sessions
function cleanupExpiredSessions() {
    db.run("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP", (err) => {
        if (err) console.error('Expired sessions cleanup error:', err.message);
    });
}
cleanupExpiredSessions();
setInterval(cleanupExpiredSessions, 6 * 60 * 60 * 1000);

function getEnvVar(key) {
    if (process.env[key]) return process.env[key];
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split(/\r?\n/);
            for (let line of lines) {
                const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
                if (match && match[1] === key) {
                    let val = match[2] || '';
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    return val.trim();
                }
            }
        } catch(e) {}
    }
    return null;
}

// OAuth Endpoints

// 1. GitHub OAuth
app.get(['/api/auth/github', '/auth/github'], (req, res) => {
    const clientId = getEnvVar('GITHUB_CLIENT_ID');
    if (!clientId) return res.status(500).send('GITHUB_CLIENT_ID не настроен в вашей панели Railway.');
    const redirectUri = `${getAppUrl(req)}/api/auth/github/callback`;
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    res.redirect(githubUrl);
});

app.get(['/api/auth/github/callback', '/auth/github/callback'], async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/?auth_error=code_missing');

    try {
        const clientId = getEnvVar('GITHUB_CLIENT_ID');
        const clientSecret = getEnvVar('GITHUB_CLIENT_SECRET');
        const redirectUri = `${getAppUrl(req)}/api/auth/github/callback`;

        const tokenRes = await fetchJson('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }, JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }));

        const accessToken = tokenRes.data?.access_token;
        if (!accessToken) return res.redirect('/?auth_error=token_failed');

        const profileRes = await fetchJson('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'DisposalLogApp'
            }
        });
        const profile = profileRes.data;

        let email = profile.email;
        if (!email) {
            const emailsRes = await fetchJson('https://api.github.com/user/emails', {
                headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'DisposalLogApp' }
            });
            if (Array.isArray(emailsRes.data)) {
                const primary = emailsRes.data.find(e => e.primary) || emailsRes.data[0];
                if (primary) email = primary.email;
            }
        }

        const name = profile.name || profile.login || 'GitHub User';
        const avatarUrl = profile.avatar_url || '';
        const providerId = String(profile.id);

        createOrGetUser('github', providerId, email, name, avatarUrl, (err, user) => {
            if (err || !user) return res.redirect('/?auth_error=user_create_failed');
            createSession(user.id, (err, token) => {
                if (err) return res.redirect('/?auth_error=session_failed');
                res.setHeader('Set-Cookie', `session_token=${token}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`);
                res.redirect(`/?session=${token}`);
            });
        });
    } catch(e) {
        console.error('GitHub Auth Error:', e);
        res.redirect('/?auth_error=github_exception');
    }
});

// 2. Google OAuth
app.get(['/api/auth/google', '/auth/google'], (req, res) => {
    const clientId = getEnvVar('GOOGLE_CLIENT_ID');
    if (!clientId) return res.status(500).send('GOOGLE_CLIENT_ID не настроен в вашей панели Railway.');
    const redirectUri = `${getAppUrl(req)}/api/auth/google/callback`;
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file&access_type=offline&prompt=consent`;
    res.redirect(googleUrl);
});

app.get(['/api/auth/google/callback', '/auth/google/callback'], async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/?auth_error=code_missing');

    try {
        const clientId = getEnvVar('GOOGLE_CLIENT_ID');
        const clientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
        const redirectUri = `${getAppUrl(req)}/api/auth/google/callback`;

        const postBody = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        }).toString();

        const tokenRes = await fetchJson('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }, postBody);

        const accessToken = tokenRes.data?.access_token;
        if (!accessToken) return res.redirect('/?auth_error=token_failed');

        const profileRes = await fetchJson('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const profile = profileRes.data;

        const email = profile.email || '';
        const name = profile.name || profile.given_name || 'Google User';
        const avatarUrl = profile.picture || '';
        const providerId = String(profile.id);

        createOrGetUser('google', providerId, email, name, avatarUrl, accessToken, (err, user) => {
            if (err || !user) return res.redirect('/?auth_error=user_create_failed');
            createSession(user.id, (err, token) => {
                if (err) return res.redirect('/?auth_error=session_failed');
                res.setHeader('Set-Cookie', `session_token=${token}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`);
                res.redirect(`/?session=${token}`);
            });
        });
    } catch(e) {
        console.error('Google OAuth error:', e);
        res.redirect('/?auth_error=google_exception');
    }
});
// Google Drive Direct Upload Endpoint
app.post('/api/upload/google-drive', sessionMiddleware, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Войдите через Google для использования собственного Google Диска' });
    }
    const googleAccessToken = req.user.google_access_token;
    if (!googleAccessToken) {
        return res.status(400).json({ error: 'Подключите аккаунт Google для прямой загрузки на ваш Google Диск' });
    }
    if (!req.files || !req.files.images) {
        return res.status(400).json({ error: 'Файлы не переданы' });
    }

    const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    const uploadedUrls = [];

    try {
        for (const fileObj of files) {
            const metadata = {
                name: fileObj.name,
                mimeType: fileObj.mimetype
            };

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + fileObj.mimetype + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n\r\n' +
                fileObj.data.toString('base64') +
                close_delim;

            const uploadRes = await fetchJson('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                }
            }, multipartRequestBody);

            const fileId = uploadRes.data?.id;
            if (fileId) {
                await fetchJson(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${googleAccessToken}`,
                        'Content-Type': 'application/json'
                    }
                }, JSON.stringify({ role: 'reader', type: 'anyone' }));

                uploadedUrls.push(`https://lh3.googleusercontent.com/d/${fileId}`);
            }
        }
        res.json({ urls: uploadedUrls });
    } catch (err) {
        console.error('Google Drive Direct Upload Error:', err);
        res.status(500).json({ error: 'Ошибка сохранения на Google Диск' });
    }
});

// Profile and Session Status
app.get(['/api/auth/me', '/auth/me'], sessionMiddleware, (req, res) => {
    res.json(req.user || null);
});

// Logout Endpoint (Supports both GET and POST)
const handleLogout = (req, res) => {
    const cookies = parseCookies(req);
    const token = cookies.session_token || req.headers['x-session-token'];
    if (token) {
        db.run(`DELETE FROM sessions WHERE token = ?`, [token], () => {});
    }
    res.setHeader('Set-Cookie', 'session_token=; Path=/; HttpOnly; Max-Age=0');
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.json({ success: true });
    } else {
        res.redirect('/');
    }
};

app.get(['/api/auth/logout', '/auth/logout'], sessionMiddleware, handleLogout);
app.post(['/api/auth/logout', '/auth/logout'], sessionMiddleware, handleLogout);

// Settings API (SQLite Persistent Settings)
app.get('/api/settings', sessionMiddleware, requireUser, (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        let settingsObj = {};
        if (rows) rows.forEach(r => settingsObj[r.key] = r.value);
        
        const templatePath = path.join(__dirname, 'telegram_template.txt');
        let template = settingsObj.telegramTemplate || '';
        if (!template && fs.existsSync(templatePath)) {
            try { template = fs.readFileSync(templatePath, 'utf8'); } catch(e){}
        }

        res.json({
            botToken: settingsObj.botToken || getEnvVar('BOT_TOKEN') || '',
            channelId: settingsObj.channelId || getEnvVar('CHANNEL_ID') || '',
            telegramTemplate: template,
            isPublicBoard: settingsObj.isPublicBoard !== '0'
        });
    });
});

app.put('/api/settings', sessionMiddleware, requireUser, (req, res) => {
    const { botToken: newToken, channelId: newChannelId, telegramTemplate: newTemplate, isPublicBoard } = req.body;
    
    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
        stmt.run('botToken', newToken || '');
        stmt.run('channelId', newChannelId || '');
        stmt.run('telegramTemplate', newTemplate || '');
        stmt.run('isPublicBoard', isPublicBoard ? '1' : '0');
        stmt.finalize();

        // Also fallback write to .env if writable
        try {
            const envPath = path.join(__dirname, '.env');
            let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
            let lines = envContent.split(/\r?\n/);
            let bOpt = false, cOpt = false;
            lines = lines.map(line => {
                if (line.startsWith('BOT_TOKEN=')) { bOpt = true; return `BOT_TOKEN=${newToken}`; }
                if (line.startsWith('CHANNEL_ID=')) { cOpt = true; return `CHANNEL_ID=${newChannelId}`; }
                return line;
            });
            if (!bOpt) lines.push(`BOT_TOKEN=${newToken}`);
            if (!cOpt) lines.push(`CHANNEL_ID=${newChannelId}`);
            fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
        } catch(e) {}

        initBot();
        res.json({ success: true });
    });
});

// Test Telegram Connection Endpoint
app.post('/api/settings/test-telegram', sessionMiddleware, requireUser, async (req, res) => {
    const channelIdVal = channelId || getEnvVar('CHANNEL_ID');
    if (!bot || !channelIdVal) {
        return res.status(400).json({ error: 'Бот не инициализирован. Проверьте Bot Token и Channel ID.' });
    }
    try {
        await bot.telegram.sendMessage(channelIdVal, '<b>🧪 PULSE Test Connection</b>\n\nТестовая связь с вашей Канбан-доской работает успешно!', { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: 'Ошибка отправки в Telegram: ' + e.message });
    }
});

// JSON Backup Export Endpoint
app.get('/api/backup/export', sessionMiddleware, requireUser, (req, res) => {
    const userId = req.user.id;
    db.all("SELECT * FROM tasks WHERE user_id = ?", [userId], (err, tasks) => {
        if (err) return res.status(500).json({ error: err.message });
        db.all("SELECT * FROM tags WHERE user_id = ?", [userId], (tagErr, tags) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=pulse_backup_${userId}_${Date.now()}.json`);
            res.send(JSON.stringify({
                exported_at: new Date().toISOString(),
                user: { id: req.user.id, name: req.user.name, email: req.user.email },
                tasks: tasks || [],
                tags: tags || []
            }, null, 2));
        });
    });
});

// Revoke Other Sessions Endpoint
app.post('/api/auth/revoke-sessions', sessionMiddleware, requireUser, (req, res) => {
    const currentToken = req.headers['x-session-token'] || parseCookies(req).session_token;
    db.run("DELETE FROM sessions WHERE user_id = ? AND token != ?", [req.user.id, currentToken || ''], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, revoked: this.changes });
    });
});

// Tags API
app.get('/api/tags', sessionMiddleware, (req, res) => {
    let query = "SELECT * FROM tags WHERE user_id = 1 OR user_id IS NULL";
    let params = [];
    if (req.user) {
        query = "SELECT * FROM tags WHERE user_id = ?";
        params = [req.user.id];
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/tags', sessionMiddleware, requireUser, (req, res) => {
    const { name, color } = req.body;
    const userId = req.user.id;
    db.run("INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)", [userId, name, color || '#3b82f6'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, color: color || '#3b82f6' });
    });
});

// Google Sheets-style Sharing API
app.get('/api/share/settings', sessionMiddleware, requireUser, (req, res) => {
    const userId = req.user.id;
    db.get("SELECT id, share_mode, share_token FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Пользователь не найден' });
        
        let token = user.share_token;
        if (!token) {
            token = crypto.randomUUID();
            db.run("UPDATE users SET share_token = ? WHERE id = ?", [token, userId]);
        }

        const shareMode = user.share_mode || 'link';
        const baseUrl = getAppUrl(req);
        let shareUrl = `${baseUrl}/?share_token=${token}`;
        if (shareMode === 'public') {
            shareUrl = `${baseUrl}/?share=${userId}`;
        }

        db.all("SELECT granted_email FROM board_access WHERE owner_id = ?", [userId], (aErr, accessRows) => {
            const invitedEmails = accessRows ? accessRows.map(r => r.granted_email) : [];
            res.json({
                shareMode,
                shareToken: token,
                shareUrl,
                invitedEmails
            });
        });
    });
});

app.put('/api/share/mode', sessionMiddleware, requireUser, (req, res) => {
    const { shareMode } = req.body;
    const allowedModes = ['private', 'public', 'link', 'restricted'];
    if (!allowedModes.includes(shareMode)) {
        return res.status(400).json({ error: 'Неверный режим доступа' });
    }
    db.run("UPDATE users SET share_mode = ? WHERE id = ?", [shareMode, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, shareMode });
    });
});

app.post('/api/share/rotate-token', sessionMiddleware, requireUser, (req, res) => {
    const newToken = crypto.randomUUID();
    db.run("UPDATE users SET share_token = ? WHERE id = ?", [newToken, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        const baseUrl = getAppUrl(req);
        res.json({ success: true, shareToken: newToken, shareUrl: `${baseUrl}/?share_token=${newToken}` });
    });
});

app.post('/api/share/invite', sessionMiddleware, requireUser, (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Укажите корректный E-mail' });
    }
    const cleanEmail = email.trim().toLowerCase();
    db.run("INSERT OR IGNORE INTO board_access (owner_id, granted_email) VALUES (?, ?)", [req.user.id, cleanEmail], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, email: cleanEmail });
    });
});

app.delete('/api/share/invite', sessionMiddleware, requireUser, (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Укажите E-mail' });
    const cleanEmail = email.trim().toLowerCase();
    db.run("DELETE FROM board_access WHERE owner_id = ? AND granted_email = ?", [req.user.id, cleanEmail], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Ensure Helper Functions for Default Board & Columns
function ensureDefaultBoardAndColumns(userId, cb) {
    db.get("SELECT * FROM boards WHERE user_id = ? ORDER BY id ASC LIMIT 1", [userId], (err, board) => {
        if (err) return cb(err);
        if (board) {
            db.run("UPDATE tasks SET board_id = ? WHERE (user_id = ? OR user_id IS NULL) AND board_id IS NULL", [board.id, userId]);
            return ensureDefaultColumnsForBoard(board.id, (cErr, cols) => cb(null, board, cols));
        }

        db.run("INSERT INTO boards (user_id, name, description) VALUES (?, ?, ?)", [userId, 'Основная доска', 'Главный бэклог проекта'], function(bErr) {
            if (bErr) return cb(bErr);
            const newBoardId = this.lastID;
            db.run("UPDATE tasks SET board_id = ? WHERE (user_id = ? OR user_id IS NULL) AND board_id IS NULL", [newBoardId, userId]);
            ensureDefaultColumnsForBoard(newBoardId, (cErr, cols) => cb(null, { id: newBoardId, name: 'Основная доска', description: 'Главный бэклог проекта' }, cols));
        });
    });
}

function ensureDefaultColumnsForBoard(boardId, cb) {
    db.all("SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC", [boardId], (err, cols) => {
        if (!err && cols && cols.length > 0) {
            return cb(null, cols);
        }
        const defaultCols = [
            { title: 'Предстоящие', key: 'todo', color: '#f85149', pos: 0 },
            { title: 'В работе', key: 'in_progress', color: '#d29922', pos: 1 },
            { title: 'Реализованные', key: 'done', color: '#2ea043', pos: 2 }
        ];
        db.serialize(() => {
            const stmt = db.prepare("INSERT INTO columns (board_id, title, column_key, color, position) VALUES (?, ?, ?, ?, ?)");
            defaultCols.forEach(c => stmt.run(boardId, c.title, c.key, c.color, c.pos));
            stmt.finalize(() => {
                db.all("SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC", [boardId], (cErr, newCols) => {
                    cb(cErr, newCols);
                });
            });
        });
    });
}

// Modular OOP Routers
const boardRoutes = require('./src/routes/boardRoutes')(sessionMiddleware, requireUser, upload);
const taskRoutes = require('./src/routes/taskRoutes')(sessionMiddleware, requireUser, upload);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);

app.post('/api/boards', sessionMiddleware, requireUser, (req, res) => {
    const { name, description, icon } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Укажите название доски' });
    const userId = req.user.id;
    const token = crypto.randomUUID();

    db.run("INSERT INTO boards (user_id, name, description, icon, share_mode, share_token) VALUES (?, ?, ?, ?, 'link', ?)",
        [userId, name.trim(), description || '', icon || '📋', token], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const boardId = this.lastID;
            ensureDefaultColumnsForBoard(boardId, (cErr, cols) => {
                res.json({ success: true, id: boardId, name: name.trim(), description: description || '', icon: icon || '📋', share_mode: 'link', share_token: token, columns: cols });
            });
    });
});

app.put('/api/boards/:id', sessionMiddleware, requireUser, (req, res) => {
    const boardId = req.params.id;
    const { name, description, icon } = req.body;
    db.run("UPDATE boards SET name = COALESCE(?, name), description = COALESCE(?, description), icon = COALESCE(?, icon) WHERE id = ? AND user_id = ?",
        [name, description, icon, boardId, req.user.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
    });
});

app.post('/api/boards/:id/icon', sessionMiddleware, requireUser, upload.single('icon'), (req, res) => {
    const boardId = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'Файл иконки не выбран' });
    const iconUrl = `/uploads/${req.file.filename}`;
    db.run("UPDATE boards SET icon = ? WHERE id = ? AND user_id = ?", [iconUrl, boardId, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, icon: iconUrl });
    });
});

app.delete('/api/boards/:id', sessionMiddleware, requireUser, (req, res) => {
    const boardId = req.params.id;
    db.run("DELETE FROM boards WHERE id = ? AND user_id = ?", [boardId, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run("DELETE FROM columns WHERE board_id = ?", [boardId]);
        db.run("DELETE FROM tasks WHERE board_id = ?", [boardId]);
        db.run("DELETE FROM board_access WHERE board_id = ?", [boardId]);
        res.json({ success: true });
    });
});

app.post('/api/boards/import', sessionMiddleware, requireUser, (req, res) => {
    const { board, columns, tasks } = req.body;
    if (!board || !board.name) return res.status(400).json({ error: 'Укажите данные доски' });

    const userId = req.user.id;
    const token = crypto.randomUUID();

    db.run("INSERT INTO boards (user_id, name, description, icon, share_mode, share_token) VALUES (?, ?, ?, ?, 'link', ?)",
        [userId, board.name.trim(), board.description || '', board.icon || '📋', token], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const newBoardId = this.lastID;

            const colsToInsert = (Array.isArray(columns) && columns.length > 0)
                ? columns
                : [
                    { column_key: 'todo', title: 'Предстоящие', position: 0, color: '#f85149' },
                    { column_key: 'in_progress', title: 'В работе', position: 1, color: '#d29922' },
                    { column_key: 'done', title: 'Реализованные', position: 2, color: '#3fb950' }
                ];

            let colsDone = 0;
            colsToInsert.forEach(col => {
                db.run("INSERT INTO columns (board_id, column_key, title, position, color) VALUES (?, ?, ?, ?, ?)",
                    [newBoardId, col.column_key, col.title, col.position || 0, col.color || '#388bfd'], () => {
                        colsDone++;
                        if (colsDone === colsToInsert.length) {
                            if (!Array.isArray(tasks) || tasks.length === 0) {
                                return res.json({ success: true, boardId: newBoardId });
                            }
                            let tasksDone = 0;
                            tasks.forEach(task => {
                                const imagesJson = typeof task.images_json === 'string' ? task.images_json : JSON.stringify(task.images || []);
                                const subtasksJson = typeof task.subtasks_json === 'string' ? task.subtasks_json : JSON.stringify(task.subtasks || []);
                                db.run("INSERT INTO tasks (user_id, board_id, title, description, status, difficulty, image_url, images_json, subtasks_json, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                    [userId, newBoardId, task.title || 'Задача', task.description || '', task.status || 'todo', task.difficulty || 1, task.image_url || '', imagesJson, subtasksJson, task.group_id || null],
                                    () => {
                                        tasksDone++;
                                        if (tasksDone === tasks.length) {
                                            res.json({ success: true, boardId: newBoardId });
                                        }
                                    }
                                );
                            });
                        }
                    }
                );
            });
    });
});

// Per-Board Sharing API
app.get('/api/boards/:id/share', sessionMiddleware, requireUser, (req, res) => {
    const boardId = req.params.id;
    db.get("SELECT * FROM boards WHERE id = ? AND user_id = ?", [boardId, req.user.id], (err, board) => {
        if (err || !board) return res.status(404).json({ error: 'Доска не найдена' });

        let token = board.share_token;
        if (!token) {
            token = crypto.randomUUID();
            db.run("UPDATE boards SET share_token = ? WHERE id = ?", [token, boardId]);
        }

        const shareMode = board.share_mode || 'link';
        const baseUrl = getAppUrl(req);
        let shareUrl = `${baseUrl}/?share_token=${token}`;
        if (shareMode === 'public') {
            shareUrl = `${baseUrl}/?share=${board.id}`;
        }

        db.all("SELECT granted_email FROM board_access WHERE board_id = ?", [boardId], (aErr, accessRows) => {
            const invitedEmails = accessRows ? accessRows.map(r => r.granted_email) : [];
            res.json({
                boardId: board.id,
                shareMode,
                shareToken: token,
                shareUrl,
                invitedEmails
            });
        });
    });
});

app.put('/api/boards/:id/share/mode', sessionMiddleware, requireUser, (req, res) => {
    const boardId = req.params.id;
    const { shareMode } = req.body;
    const allowedModes = ['private', 'public', 'link', 'restricted'];
    if (!allowedModes.includes(shareMode)) return res.status(400).json({ error: 'Неверный режим доступа' });

    db.run("UPDATE boards SET share_mode = ? WHERE id = ? AND user_id = ?", [shareMode, boardId, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, shareMode });
    });
});

app.post('/api/boards/:id/share/rotate-token', sessionMiddleware, requireUser, (req, res) => {
    const boardId = req.params.id;
    const newToken = crypto.randomUUID();
    db.run("UPDATE boards SET share_token = ? WHERE id = ? AND user_id = ?", [newToken, boardId, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        const baseUrl = getAppUrl(req);
        res.json({ success: true, shareToken: newToken, shareUrl: `${baseUrl}/?share_token=${newToken}` });
    });
});

app.post('/api/boards/:id/share/invite', sessionMiddleware, requireUser, (req, res) => {
    const boardId = req.params.id;
    const { email } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Укажите корректный E-mail' });

    const cleanEmail = email.trim().toLowerCase();
    db.run("INSERT INTO board_access (board_id, owner_id, granted_email) VALUES (?, ?, ?)", [boardId, req.user.id, cleanEmail], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, email: cleanEmail });
    });
});

app.delete('/api/boards/:id/share/invite', sessionMiddleware, requireUser, (req, res) => {
    const boardId = req.params.id;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Укажите E-mail' });

    const cleanEmail = email.trim().toLowerCase();
    db.run("DELETE FROM board_access WHERE board_id = ? AND granted_email = ?", [boardId, cleanEmail], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Dynamic Columns API
app.get('/api/boards/:boardId/columns', sessionMiddleware, (req, res) => {
    const boardId = req.params.boardId;
    ensureDefaultColumnsForBoard(boardId, (err, cols) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(cols || []);
    });
});

app.post('/api/boards/:boardId/columns', sessionMiddleware, requireUser, (req, res) => {
    const boardId = req.params.boardId;
    const { title, color } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Укажите название колонки' });
    
    const key = 'col_' + Date.now() + '_' + Math.round(Math.random() * 1000);
    db.get("SELECT MAX(position) as maxPos FROM columns WHERE board_id = ?", [boardId], (err, row) => {
        const nextPos = (row && row.maxPos !== null) ? row.maxPos + 1 : 0;
        db.run("INSERT INTO columns (board_id, title, column_key, color, position) VALUES (?, ?, ?, ?, ?)", 
            [boardId, title.trim(), key, color || '#388bfd', nextPos], function(cErr) {
                if (cErr) return res.status(500).json({ error: cErr.message });
                res.json({ id: this.lastID, board_id: boardId, title: title.trim(), column_key: key, color: color || '#388bfd', position: nextPos });
        });
    });
});

app.put('/api/columns/:id', sessionMiddleware, requireUser, (req, res) => {
    const colId = req.params.id;
    const { title, color, position } = req.body;
    db.run("UPDATE columns SET title = COALESCE(?, title), color = COALESCE(?, color), position = COALESCE(?, position) WHERE id = ?",
        [title, color, position, colId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
    });
});

app.delete('/api/columns/:id', sessionMiddleware, requireUser, (req, res) => {
    const colId = req.params.id;
    db.run("DELETE FROM columns WHERE id = ?", [colId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Public Board View Endpoint with Google Sheets Access Control Logic
app.get('/api/public/board/:identifier', sessionMiddleware, (req, res) => {
    const identifier = req.params.identifier;
    const tokenQuery = req.query.token;

    db.get("SELECT id, name, email, avatar_url, provider, share_mode, share_token FROM users WHERE id = ? OR share_token = ?", [identifier, identifier], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Пользователь или доска не найдена' });

        const shareMode = user.share_mode || 'link';

        // 1. Private Mode
        if (shareMode === 'private') {
            if (!req.user || req.user.id !== user.id) {
                return res.status(403).json({ error: 'Доска приватная. Владелец отключил доступ.' });
            }
        }

        // 2. Link Access Mode (Requires secret token in identifier or query)
        if (shareMode === 'link') {
            const matchesToken = (identifier === user.share_token) || (tokenQuery === user.share_token);
            const isOwner = req.user && req.user.id === user.id;
            if (!matchesToken && !isOwner) {
                return res.status(403).json({ error: 'Доступ возможен только по секретной ссылке.' });
            }
        }

        // 3. Restricted Mode (Requires specific email grant)
        if (shareMode === 'restricted') {
            const isOwner = req.user && req.user.id === user.id;
            if (!isOwner) {
                if (!req.user || !req.user.email) {
                    return res.status(403).json({ error: 'Доступ ограничен. Войдите под аккаунтом, которому предоставлен доступ.', requireAuth: true });
                }
                const userEmail = req.user.email.toLowerCase();
                db.get("SELECT id FROM board_access WHERE owner_id = ? AND granted_email = ?", [user.id, userEmail], (aErr, access) => {
                    if (aErr || !access) {
                        return res.status(403).json({ error: `У вашего аккаунта (${userEmail}) нет доступа к этой доске.` });
                    }
                    sendBoardData(res, user);
                });
                return;
            }
        }

        sendBoardData(res, user);
    });

    function sendBoardData(res, user) {
        db.all("SELECT * FROM tasks WHERE user_id = ? ORDER BY status DESC, position ASC, created_at DESC", [user.id], (tErr, rows) => {
            if (tErr) return res.status(500).json({ error: tErr.message });
            rows.forEach(r => {
                if (r.images_json) { try { r.images = JSON.parse(r.images_json); } catch(e) { r.images = []; } }
                else if (r.image_url) { r.images = [r.image_url]; }
                else { r.images = []; }
                
                if (r.tags_json) { try { r.tags = JSON.parse(r.tags_json); } catch(e) { r.tags = []; } }
                else { r.tags = []; }
            });
            
            db.all("SELECT * FROM tags WHERE user_id = ?", [user.id], (tagErr, tagRows) => {
                res.json({
                    user: { id: user.id, name: user.name, avatar_url: user.avatar_url, provider: user.provider, share_mode: user.share_mode },
                    tasks: rows,
                    tags: tagRows || []
                });
            });
        });
    }
});

// Tasks API
app.get('/api/tasks', sessionMiddleware, (req, res) => {
    const boardId = req.query.board_id;
    const userId = req.user ? req.user.id : null;

    if (userId && boardId) {
        db.run("UPDATE tasks SET board_id = ? WHERE (user_id = ? OR user_id IS NULL) AND board_id IS NULL", [boardId, userId]);
    }

    let query = "SELECT * FROM tasks WHERE (user_id = 1 OR user_id IS NULL) ORDER BY status DESC, position ASC, created_at DESC";
    let params = [];
    
    if (userId) {
        if (boardId) {
            query = "SELECT * FROM tasks WHERE (user_id = ? OR user_id IS NULL) AND (board_id = ? OR board_id IS NULL) ORDER BY position ASC, created_at DESC";
            params = [userId, boardId];
        } else {
            query = "SELECT * FROM tasks WHERE user_id = ? ORDER BY position ASC, created_at DESC";
            params = [userId];
        }
    } else {
        if (boardId) {
            query = "SELECT * FROM tasks WHERE (board_id = ? OR board_id IS NULL) ORDER BY position ASC, created_at DESC";
            params = [boardId];
        }
    }
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows = rows || [];
        rows.forEach(r => {
            if (r.images_json) { try { r.images = JSON.parse(r.images_json); } catch(e) { r.images = []; } }
            else if (r.image_url) { r.images = [r.image_url]; }
            else { r.images = []; }
            
            if (r.tags_json) { try { r.tags = JSON.parse(r.tags_json); } catch(e) { r.tags = []; } }
            else { r.tags = []; }
        });
        res.json(rows);
    });
});

app.post('/api/tasks', sessionMiddleware, requireUser, upload.array('images', 5), (req, res) => {
    const { title, description, difficulty, tags, parent_id, board_id, status } = req.body;
    const userId = req.user.id;
    let images = [];
    if (req.files && req.files.length > 0) {
        images = req.files.map(f => `/uploads/${f.filename}`);
    }
    const imagesJson = JSON.stringify(images);
    const tagsJson = tags || '[]';
    
    const initialStatus = status || (parent_id ? 'locked' : 'todo');
    const query = `INSERT INTO tasks (user_id, board_id, title, description, images_json, difficulty, tags_json, status, position, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 9999, ?)`;
    db.run(query, [userId, board_id || null, title, description, imagesJson, difficulty || 1, tagsJson, initialStatus, parent_id || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.put('/api/tasks/positions', sessionMiddleware, requireUser, (req, res) => {
    const { updates } = req.body;
    const userId = req.user.id;
    const ids = updates.map(u => u.id);
    if (ids.length === 0) return res.json({ success: true });

    db.all(`SELECT id, status FROM tasks WHERE id IN (${ids.join(',')}) AND (user_id = ? OR user_id IS NULL)`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const oldStatuses = {};
        rows.forEach(r => oldStatuses[r.id] = r.status);
        
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            updates.forEach(u => {
                let query = "UPDATE tasks SET position = ?, status = ?";
                let params = [u.position, u.status];
                if (u.status === 'done' && oldStatuses[u.id] !== 'done') {
                    query += ", completed_at = CURRENT_TIMESTAMP";
                }
                if (u.status !== 'todo') {
                    query += ", group_id = NULL";
                }
                query += " WHERE id = ? AND (user_id = ? OR user_id IS NULL)";
                params.push(u.id, userId);
                db.run(query, params);
            });
            db.run("COMMIT", (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
        });
    });
});

app.put('/api/tasks/:id/status', sessionMiddleware, requireUser, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    db.get("SELECT * FROM tasks WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [id, userId], async (err, task) => {
        if (err || !task) return res.status(404).json({ error: 'Task not found' });
        
        let query = `UPDATE tasks SET status = ?`;
        let params = [status];
        if (status === 'done') query += `, completed_at = CURRENT_TIMESTAMP`;
        if (status !== 'todo') query += `, group_id = NULL`;
        query += ` WHERE id = ? AND (user_id = ? OR user_id IS NULL)`;
        params.push(id, userId);
        
        db.run(query, params, async function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.put('/api/tasks/:id/link', sessionMiddleware, requireUser, (req, res) => {
    const { id } = req.params;
    const { parent_id: target_id } = req.body;
    const userId = req.user.id;
    
    if (!target_id) return res.status(400).json({ error: 'target_id is required' });
    
    db.get("SELECT * FROM tasks WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [target_id, userId], (err, targetTask) => {
        if (err || !targetTask) return res.status(404).json({ error: 'Target task not found' });
        
        if (targetTask.status !== 'todo') {
            return res.status(400).json({ error: 'Stacking is only allowed in TODO' });
        }
        
        let groupId = targetTask.group_id;
        if (!groupId) {
            groupId = Date.now().toString() + Math.random().toString().substring(2, 6);
            db.run("UPDATE tasks SET group_id = ? WHERE id = ?", [groupId, target_id]);
        }
        
        db.run("UPDATE tasks SET group_id = ?, position = ?, created_at = CURRENT_TIMESTAMP WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [groupId, targetTask.position - 1, id, userId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, group_id: groupId });
        });
    });
});

app.put('/api/tasks/:id/unlink', sessionMiddleware, requireUser, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    db.get("SELECT group_id FROM tasks WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [id, userId], (err, row) => {
        if (err || !row || !row.group_id) {
            return db.run("UPDATE tasks SET parent_id = NULL, group_id = NULL WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [id, userId], () => res.json({ success: true }));
        }
        
        const groupId = row.group_id;
        db.run("UPDATE tasks SET group_id = NULL, parent_id = NULL WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [id, userId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.delete('/api/tasks/:id', sessionMiddleware, requireUser, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    db.run("DELETE FROM tasks WHERE id = ? AND (user_id = ? OR user_id IS NULL)", [id, userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Health check endpoint (MUST respond 200 OK immediately for Railway)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Serve static frontend assets (dist for Vite React, fallback to public)
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const staticDir = fs.existsSync(distDir) ? distDir : publicDir;

app.use(express.static(staticDir));

// Express 5.x catch-all route handler for SPA fallback
app.get('*splat', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/uploads') || req.path === '/health') {
        return next();
    }
    const indexPath = path.resolve(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(200).send('OK');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
