const express = require('express');
const taskRepository = require('../repositories/taskRepository');
const tagRepository = require('../repositories/tagRepository');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

router.get(['/export', '/download'], requireUser, async (req, res) => {
    const userId = req.user.id;
    const [tasks, tags] = await Promise.all([taskRepository.findByUserId(userId), tagRepository.findByUserId(userId)]);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=pulse_backup_${userId}_${Date.now()}.json`);
    res.send(JSON.stringify({
        exported_at: new Date().toISOString(),
        user: { id: userId, name: req.user.name, email: req.user.email },
        tasks,
        tags
    }, null, 2));
});

module.exports = router;
