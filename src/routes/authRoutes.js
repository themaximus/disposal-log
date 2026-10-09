const express = require('express');
const config = require('../config');
const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');
const { requireUser, setSessionCookie, clearSessionCookie } = require('../middleware/auth');
const { getAppUrl, buildSameOriginUrl } = require('../utils/url');
const { json } = require('../utils/errors');

const router = express.Router();
const SESSION_MAX_AGE_SECONDS = Math.floor(config.sessionTtlMs / 1000);

const githubCallbackUrl = (req) => `${getAppUrl(req)}/api/auth/github/callback`;
const googleCallbackUrl = (req) => `${getAppUrl(req)}/api/auth/google/callback`;

function requireProviderConfig(provider) {
    return (req, res, next) => {
        if (!config[provider].clientId) {
            const name = `${provider.toUpperCase()}_CLIENT_ID`;
            return res.status(500).send(`${name} не настроен в вашей панели Railway.`);
        }
        next();
    };
}

async function startSession(res, user) {
    const token = await authService.createSession(user.id);
    setSessionCookie(res, token, SESSION_MAX_AGE_SECONDS);
    return token;
}

function parseOAuthState(rawState) {
    if (!rawState) return {};
    try {
        return JSON.parse(rawState);
    } catch (e) {
        return {};
    }
}

// --- GitHub ---------------------------------------------------------------

router.get('/github', requireProviderConfig('github'), (req, res) => {
    res.redirect(authService.githubAuthorizeUrl(githubCallbackUrl(req)));
});

router.get('/github/callback', async (req, res) => {
    if (!req.query.code) return res.redirect('/?auth_error=code_missing');
    try {
        const profile = await authService.fetchGithubProfile(req.query.code, githubCallbackUrl(req));
        if (!profile) return res.redirect('/?auth_error=token_failed');

        const user = await authService.findOrCreateUser(profile);
        const token = await startSession(res, user);
        res.redirect(`/?session=${token}`);
    } catch (err) {
        console.error('GitHub Auth Error:', err);
        res.redirect('/?auth_error=github_exception');
    }
});

// --- Google ---------------------------------------------------------------

router.get('/google', requireProviderConfig('google'), (req, res) => {
    res.redirect(authService.googleAuthorizeUrl(googleCallbackUrl(req)));
});

// Asks for Drive access on top of the login scopes; used for media uploads.
router.get('/google-drive', requireProviderConfig('google'), (req, res) => {
    const state = JSON.stringify({ referer: req.headers.referer || '/', origin: req.query.origin || 'default' });
    res.redirect(authService.googleAuthorizeUrl(googleCallbackUrl(req), { withDrive: true, state }));
});

router.get('/google/callback', async (req, res) => {
    if (!req.query.code) return res.redirect('/?auth_error=code_missing');
    const { referer = '/', origin = 'default' } = parseOAuthState(req.query.state);

    try {
        const profile = await authService.fetchGoogleProfile(req.query.code, googleCallbackUrl(req));
        if (!profile) return res.redirect('/?auth_error=token_failed');

        let token;
        if (req.user) {
            // Already signed in (e.g. via GitHub): just link the Drive token.
            await userRepository.setGoogleAccessToken(req.user.id, profile.googleAccessToken);
            token = req.sessionToken;
        } else {
            const user = await authService.findOrCreateUser(profile);
            token = await startSession(res, user);
        }
        res.redirect(buildSameOriginUrl(req, referer, { session: token, origin, drive_connected: 'true' }));
    } catch (err) {
        console.error('Google OAuth error:', err);
        res.redirect('/?auth_error=google_exception');
    }
});

router.post('/google-drive/unlink', requireUser, json(async (req) => {
    await userRepository.setGoogleAccessToken(req.user.id, null);
    return { success: true };
}));

// --- Session --------------------------------------------------------------

router.get('/me', (req, res) => {
    res.json({ user: req.user });
});

async function logout(req, res) {
    if (req.sessionToken) await sessionRepository.delete(req.sessionToken);
    clearSessionCookie(res);
    if (req.accepts(['html', 'json']) === 'json' || req.method === 'POST') {
        return res.json({ success: true });
    }
    res.redirect('/');
}

router.get('/logout', logout);
router.post('/logout', logout);

router.post('/revoke-sessions', requireUser, json(async (req) => {
    const revoked = await sessionRepository.deleteOthers(req.user.id, req.sessionToken);
    return { success: true, revoked };
}));

module.exports = router;
