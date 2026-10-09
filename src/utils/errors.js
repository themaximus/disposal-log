class HttpError extends Error {
    constructor(status, message, extra = {}) {
        super(message);
        this.status = status;
        this.extra = extra;
    }
}

const badRequest = (message) => new HttpError(400, message);
const notFound = (message) => new HttpError(404, message);
const forbidden = (message, extra) => new HttpError(403, message, extra);

// Express 5 forwards rejected promises to the error handler on its own; this
// wrapper only keeps handlers short by letting them return the JSON payload.
const json = (handler) => async (req, res) => {
    const payload = await handler(req, res);
    if (payload !== undefined && !res.headersSent) res.json(payload);
};

module.exports = { HttpError, badRequest, notFound, forbidden, json };
