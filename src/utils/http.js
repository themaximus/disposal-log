const https = require('https');

// Minimal HTTPS client for OAuth / Google APIs. Resolves with the parsed JSON
// body (or raw text when the response is not JSON) plus the status code.
function fetchJson(url, options = {}, body = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(new URL(url), options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed = data;
                try { parsed = data ? JSON.parse(data) : null; } catch (e) { /* keep raw text */ }
                resolve({ status: res.statusCode, data: parsed });
            });
        });
        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

module.exports = { fetchJson };
