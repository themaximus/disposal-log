const db = require('../../database');

function startTrashAutoPurgeWorker() {
  const autoPurgeOldTrash = () => {
    db.all("SELECT id, images_json, image_url FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-30 days')", [], (err, oldTasks) => {
      if (err || !oldTasks || oldTasks.length === 0) return;

      oldTasks.forEach(task => {
        db.run("DELETE FROM tasks WHERE id = ?", [task.id]);
      });
      console.log(`[AutoPurge Worker] Purged ${oldTasks.length} tasks older than 30 days.`);
    });
  };

  // Run initial check on startup
  autoPurgeOldTrash();

  // Run every 24 hours
  setInterval(autoPurgeOldTrash, 24 * 60 * 60 * 1000);
}

module.exports = { startTrashAutoPurgeWorker };
