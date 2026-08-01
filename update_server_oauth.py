import re

with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Helper function to get app url
app_url_helper = """
const crypto = require('crypto');
const https = require('https');
const http = require('http');

function getAppUrl(req) {
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    if (process.env.APP_URL) {
        return process.env.APP_URL.replace(/\\/$/, '');
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
        if (row) {
            db.run(`UPDATE users SET email = ?, name = ?, avatar_url = ? WHERE id = ?`, [email, name, avatarUrl, row.id], () => {
                callback(null, { ...row, email, name, avatar_url: avatarUrl });
            });
        } else {
            db.run(`INSERT INTO users (provider, provider_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
                [provider, providerId, email, name, avatarUrl], function(err2) {
                    if (err2) return callback(err2);
                    callback(null, { id: this.lastID, provider, provider_id: providerId, email, name, avatar_url: avatarUrl });
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
"""

print("Writing helper code...")
