const sqlite3 = require('sqlite3');
const config = require('../config');

const connection = new sqlite3.Database(config.dbPath);

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });
}

// The app shares a single SQLite connection, so transactions are serialized
// through this promise chain to keep BEGIN/COMMIT pairs from interleaving.
let transactionQueue = Promise.resolve();

function transaction(work) {
    const result = transactionQueue.then(async () => {
        await run('BEGIN TRANSACTION');
        try {
            const value = await work();
            await run('COMMIT');
            return value;
        } catch (err) {
            await run('ROLLBACK').catch(() => {});
            throw err;
        }
    });
    transactionQueue = result.catch(() => {});
    return result;
}

function close() {
    return new Promise((resolve, reject) => {
        connection.close(err => (err ? reject(err) : resolve()));
    });
}

module.exports = { run, get, all, transaction, close, dbPath: config.dbPath };
