const config = require('./src/config');
const db = require('./src/db');
const { initSchema } = require('./src/db/schema');
const { createApp } = require('./src/app');
const { startMaintenanceJobs } = require('./src/services/maintenanceService');

const SHUTDOWN_TIMEOUT_MS = 8000;

async function main() {
    await initSchema();
    console.log('Connected to SQLite database at:', db.dbPath);

    const stopMaintenance = startMaintenanceJobs();
    const server = createApp().listen(config.port, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${config.port}`);
    });

    let shuttingDown = false;
    function shutdown(signal) {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`Received ${signal}. Starting graceful shutdown...`);

        setTimeout(() => {
            console.warn('Graceful shutdown timeout exceeded. Forcing exit.');
            process.exit(0);
        }, SHUTDOWN_TIMEOUT_MS).unref();

        stopMaintenance();
        server.close(async (err) => {
            if (err) console.error('Error closing HTTP server:', err.message);
            try {
                await db.close(); // flushes the WAL and releases the volume file lock
            } catch (dbErr) {
                console.error('Error closing SQLite DB:', dbErr.message);
            }
            process.exit(0);
        });
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
