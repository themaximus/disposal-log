const crypto = require('crypto');
const config = require('../config');
const { fetchJson } = require('../utils/http');
const userRepository = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');

const OWNER_ID = 1;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_LOGIN_SCOPE = 'openid profile email';
const GOOGLE_DRIVE_SCOPE = `${GOOGLE_LOGIN_SCOPE} https://www.googleapis.com/auth/drive.file`;

async function findOrCreateUser({ provider, providerId, email, name, avatarUrl, googleAccessToken = null }) {
    const existing = await userRepository.findByProvider(provider, providerId);
    let userId;
    if (existing) {
        await userRepository.updateProfile(existing.id, { email, name, avatarUrl, googleAccessToken });
        userId = existing.id;
    } else {
        userId = await userRepository.create({ provider, providerId, email, name, avatarUrl, googleAccessToken });
    }
    if (userId === OWNER_ID) await userRepository.adoptOrphanedRows(OWNER_ID);
    return userRepository.findById(userId);
}

async function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.sessionTtlMs).toISOString();
    await sessionRepository.create(token, userId, expiresAt);
    return token;
}

// --- GitHub ---------------------------------------------------------------

function githubAuthorizeUrl(redirectUri) {
    const params = new URLSearchParams({ client_id: config.github.clientId, redirect_uri: redirectUri, scope: 'user:email' });
    return `https://github.com/login/oauth/authorize?${params}`;
}

async function fetchGithubProfile(code, redirectUri) {
    const tokenRes = await fetchJson('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    }, {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: redirectUri
    });
    const accessToken = tokenRes.data && tokenRes.data.access_token;
    if (!accessToken) return null;

    const headers = { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'DisposalLogApp' };
    const { data: profile } = await fetchJson('https://api.github.com/user', { headers });

    let email = profile.email;
    if (!email) {
        const { data: emails } = await fetchJson('https://api.github.com/user/emails', { headers });
        if (Array.isArray(emails)) {
            const primary = emails.find(e => e.primary) || emails[0];
            if (primary) email = primary.email;
        }
    }

    return {
        provider: 'github',
        providerId: String(profile.id),
        email,
        name: profile.name || profile.login || 'GitHub User',
        avatarUrl: profile.avatar_url || ''
    };
}

// --- Google ---------------------------------------------------------------

function googleAuthorizeUrl(redirectUri, { withDrive = false, state = null } = {}) {
    const params = new URLSearchParams({
        client_id: config.google.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: withDrive ? GOOGLE_DRIVE_SCOPE : GOOGLE_LOGIN_SCOPE
    });
    if (withDrive) {
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
    }
    if (state) params.set('state', state);
    return `${GOOGLE_AUTH_URL}?${params}`;
}

async function fetchGoogleProfile(code, redirectUri) {
    const body = new URLSearchParams({
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
    }).toString();

    const tokenRes = await fetchJson('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, body);
    const accessToken = tokenRes.data && tokenRes.data.access_token;
    if (!accessToken) return null;

    const { data: profile } = await fetchJson('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
        provider: 'google',
        providerId: String(profile.id),
        email: profile.email || '',
        name: profile.name || profile.given_name || 'Google User',
        avatarUrl: profile.picture || '',
        googleAccessToken: accessToken
    };
}

module.exports = {
    findOrCreateUser,
    createSession,
    githubAuthorizeUrl,
    fetchGithubProfile,
    googleAuthorizeUrl,
    fetchGoogleProfile
};
