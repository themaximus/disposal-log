function parseJsonArray(value) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

// Accepts either an array or an already-serialized JSON string from clients.
function toJsonArray(value) {
    if (typeof value === 'string') return value;
    return JSON.stringify(Array.isArray(value) ? value : []);
}

function serializeTask(row) {
    if (!row) return row;
    const images = parseJsonArray(row.images_json);
    return {
        ...row,
        images: images.length > 0 || !row.image_url ? images : [row.image_url],
        tags: parseJsonArray(row.tags_json),
        subtasks: parseJsonArray(row.subtasks_json)
    };
}

module.exports = { parseJsonArray, toJsonArray, serializeTask };
