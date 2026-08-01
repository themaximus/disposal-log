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

function createOrGetUser(provider, providerId, email, name, avatarUrl, callback) {
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
            db.run(`UPDATE users SET email = ?, name = ?, avatar_url = ? WHERE id = ?`, [email, name, avatarUrl, row.id], () => {
                handleUser({ ...row, email, name, avatar_url: avatarUrl });
            });
        } else {
            db.run(`INSERT INTO users (provider, provider_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
                [provider, providerId, email, name, avatarUrl], function(err2) {
                    if (err2) return callback(err2);
                    handleUser({ id: this.lastID, provider, provider_id: providerId, email, name, avatar_url: avatarUrl });
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
app.use(express.static('public'));
app.use('/uploads', express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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
app.get('/api/auth/github', (req, res) => {
    const clientId = getEnvVar('GITHUB_CLIENT_ID');
    if (!clientId) return res.status(500).send('GITHUB_CLIENT_ID не настроен в вашей панели Railway.');
    const redirectUri = `${getAppUrl(req)}/api/auth/github/callback`;
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    res.redirect(githubUrl);
});

app.get('/api/auth/github/callback', async (req, res) => {
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
app.get('/api/auth/google', (req, res) => {
    const clientId = getEnvVar('GOOGLE_CLIENT_ID');
    if (!clientId) return res.status(500).send('GOOGLE_CLIENT_ID не настроен в вашей панели Railway.');
    const redirectUri = `${getAppUrl(req)}/api/auth/google/callback`;
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email`;
    res.redirect(googleUrl);
});

app.get('/api/auth/google/callback', async (req, res) => {
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

        createOrGetUser('google', providerId, email, name, avatarUrl, (err, user) => {
            if (err || !user) return res.redirect('/?auth_error=user_create_failed');
            createSession(user.id, (err, token) => {
                if (err) return res.redirect('/?auth_error=session_failed');
                res.setHeader('Set-Cookie', `session_token=${token}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`);
                res.redirect(`/?session=${token}`);
            });
        });
    } catch(e) {
        console.error('Google Auth Error:', e);
        res.redirect('/?auth_error=google_exception');
    }
});

// Profile and Session Status
app.get('/api/auth/me', sessionMiddleware, (req, res) => {
    res.json({ user: req.user });
});

// Logout Endpoint
app.post('/api/auth/logout', sessionMiddleware, (req, res) => {
    const cookies = parseCookies(req);
    const token = cookies.session_token || req.headers['x-session-token'];
    if (token) {
        db.run(`DELETE FROM sessions WHERE token = ?`, [token], () => {});
    }
    res.setHeader('Set-Cookie', 'session_token=; Path=/; HttpOnly; Max-Age=0');
    res.json({ success: true });
});

// Settings API
app.get('/api/settings', (req, res) => {
    initBot();
    const templatePath = path.join(__dirname, 'telegram_template.txt');
    let template = '';
    if (fs.existsSync(templatePath)) {
        try { template = fs.readFileSync(templatePath, 'utf8'); } catch(e){}
    }
    res.json({
        botToken: botToken ? botToken.substring(0, 8) + '...' : '',
        channelId: channelId || '',
        telegramTemplate: template
    });
});

app.put('/api/settings', sessionMiddleware, requireUser, (req, res) => {
    const { botToken: newToken, channelId: newChannelId, telegramTemplate: newTemplate } = req.body;
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    let botTokenUpdated = false;
    let channelIdUpdated = false;
    
    const lines = envContent.split(/\r?\n/);
    const newLines = lines.map(line => {
        if (line.trim().startsWith('BOT_TOKEN=')) {
            botTokenUpdated = true;
            return `BOT_TOKEN=${newToken}`;
        }
        if (line.trim().startsWith('CHANNEL_ID=')) {
            channelIdUpdated = true;
            return `CHANNEL_ID=${newChannelId}`;
        }
        return line;
    });
    
    if (!botTokenUpdated) newLines.push(`BOT_TOKEN=${newToken}`);
    if (!channelIdUpdated) newLines.push(`CHANNEL_ID=${newChannelId}`);
    
    try {
        fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
        if (typeof newTemplate === 'string') {
            const templatePath = path.join(__dirname, 'telegram_template.txt');
            fs.writeFileSync(templatePath, newTemplate, 'utf8');
        }
        initBot();
        res.json({ success: true });
    } catch (e) {
        console.error('Error writing settings:', e);
        res.status(500).json({ error: 'Failed to write settings' });
    }
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

// Tasks API
app.get('/api/tasks', sessionMiddleware, (req, res) => {
    let query = "SELECT * FROM tasks WHERE user_id = 1 OR user_id IS NULL ORDER BY status DESC, position ASC, created_at DESC";
    let params = [];
    
    if (req.user) {
        query = "SELECT * FROM tasks WHERE user_id = ? ORDER BY status DESC, position ASC, created_at DESC";
        params = [req.user.id];
    }
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
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
    const { title, description, difficulty, tags, parent_id } = req.body;
    const userId = req.user.id;
    let images = [];
    if (req.files && req.files.length > 0) {
        images = req.files.map(f => `/uploads/${f.filename}`);
    }
    const imagesJson = JSON.stringify(images);
    const tagsJson = tags || '[]';
    
    const initialStatus = parent_id ? 'locked' : 'todo';
    const query = `INSERT INTO tasks (user_id, title, description, images_json, difficulty, tags_json, status, position, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, 9999, ?)`;
    db.run(query, [userId, title, description, imagesJson, difficulty || 1, tagsJson, initialStatus, parent_id || null], function(err) {
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

// Health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
