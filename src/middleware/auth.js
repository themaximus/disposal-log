const sessionRepository = require('../repositories/sessionRepository');

const SESSION_COOKIE = 'session_token';

function parseCookies(req) {
    const cookies = {};
    const header = req.headers.cookie;
    if (!header) return cookies;
    for (const part of header.split(';')) {
        const index = part.indexOf('=');
        if (index < 0) continue;
        const key = part.slice(0, index).trim();
        try {
            cookies[key] = decodeURIComponent(part.slice(index + 1).trim());
        } catch (e) {
            cookies[key] = part.slice(index + 1).trim();
        }
    }
    return cookies;
}

function getSessionToken(req) {
    const auth = req.headers.authorization;
    const bearer = auth && auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
    return parseCookies(req)[SESSION_COOKIE] || req.headers['x-session-token'] || bearer || null;
}

function setSessionCookie(res, token, maxAgeSeconds) {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Max-Age=${maxAgeSeconds}; SameSite=Lax`);
}

function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
}

// Resolves the session (if any) into req.user. Never rejects the request.
async function attachUser(req, res, next) {
    req.user = null;
    req.sessionToken = getSessionToken(req);
    if (!req.sessionToken) return next();

    try {
        const row = await sessionRepository.findUserByToken(req.sessionToken);
        if (row && new Date(row.expires_at) > new Date()) {
            const { expires_at, ...user } = row;
            req.user = user;
        }
    } catch (err) {
        console.error('Session lookup failed:', err.message);
    }
    next();
}

function requireUser(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Авторизуйтесь через Google или GitHub' });
    }
    next();
}

module.exports = { attachUser, requireUser, getSessionToken, setSessionCookie, clearSessionCookie };
