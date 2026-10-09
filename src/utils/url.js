const config = require('../config');

function getAppUrl(req) {
    if (config.publicDomain) return `https://${config.publicDomain}`;
    if (config.appUrl) return config.appUrl;
    const host = req.headers.host || `localhost:${config.port}`;
    const proto = req.headers['x-forwarded-proto'] || 'http';
    return `${proto}://${host}`;
}

// Builds a redirect URL on this app's own origin. Anything pointing to a
// foreign origin falls back to the root so session tokens never leave the app.
function buildSameOriginUrl(req, target, params = {}) {
    const appUrl = getAppUrl(req);
    let url;
    try {
        url = new URL(target || '/', appUrl);
    } catch (e) {
        url = new URL('/', appUrl);
    }
    if (url.origin !== new URL(appUrl).origin) url = new URL('/', appUrl);

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) url.searchParams.set(key, value);
    }
    return url.toString();
}

module.exports = { getAppUrl, buildSameOriginUrl };
