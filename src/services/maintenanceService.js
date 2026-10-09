const config = require('../config');
const sessionRepository = require('../repositories/sessionRepository');
const taskRepository = require('../repositories/taskRepository');

async function cleanupExpiredSessions() {
    try {
        await sessionRepository.deleteExpired();
    } catch (err) {
        console.error('Expired sessions cleanup error:', err.message);
    }
}

async function purgeOldTrash() {
    try {
        const purged = await taskRepository.purgeDeletedBefore(config.trashRetentionDays);
        if (purged) console.log(`[AutoPurge] Purged ${purged} tasks older than ${config.trashRetentionDays} days.`);
    } catch (err) {
        console.error('Auto purge trash error:', err.message);
    }
}

// Runs periodic housekeeping jobs. Returns a function that stops them.
function startMaintenanceJobs() {
    cleanupExpiredSessions();
    purgeOldTrash();
    const timers = [
        setInterval(cleanupExpiredSessions, config.sessionCleanupIntervalMs),
        setInterval(purgeOldTrash, config.trashPurgeIntervalMs)
    ];
    timers.forEach(t => t.unref());
    return () => timers.forEach(clearInterval);
}

module.exports = { startMaintenanceJobs };
