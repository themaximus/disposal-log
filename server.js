require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { Telegraf } = require('telegraf');

const app = express();
const port = process.env.PORT || 3000;

// Railway Volume / Data Directory Support
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || __dirname;
const uploadsDir = path.resolve(dataDir, 'uploads');
const backupsDir = path.resolve(dataDir, 'backups');

if (!fs.existsSync(uploadsDir)) { try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch(e){} }
if (!fs.existsSync(backupsDir)) { try { fs.mkdirSync(backupsDir, { recursive: true }); } catch(e){} }

// Admin Master Password for Owner Protection
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function authMiddleware(req, res, next) {
    const key = req.headers['x-admin-key'] || req.headers['authorization'];
    if (key === ADMIN_PASSWORD || key === `Bearer ${ADMIN_PASSWORD}`) {
        return next();
    }
    return res.status(401).json({ error: 'Доступ запрещен. Требуется пароль владельца.' });
}

// Telegram Bot setup
let botToken = process.env.BOT_TOKEN;
let channelId = process.env.CHANNEL_ID;
let bot = null;

function initBot() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split(/\r?\n/);
            lines.forEach(line => {
                const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                    const key = match[1];
                    let value = match[2] || '';
                    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                    
                    if (key === 'BOT_TOKEN') botToken = value.trim();
                    if (key === 'CHANNEL_ID') channelId = value.trim();
                }
            });
        } catch (e) {
            console.error('Error reading .env for bot init:', e);
        }
    }
    
    if (botToken) {
        try {
            bot = new Telegraf(botToken);
            console.log('Telegram Bot initialized with token:', botToken.substring(0, 10) + '...');
        } catch (e) {
            console.error('Failed to initialize Telegraf bot:', e.message);
            bot = null;
        }
    } else {
        bot = null;
        console.log('Telegram Bot disabled (no BOT_TOKEN found).');
    }
}
initBot();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API Endpoints

// Anti-Bruteforce Rate Limiter for Auth
const authAttempts = new Map(); // ip -> { count, lockUntil }

app.post('/api/auth/login', (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const attempt = authAttempts.get(ip) || { count: 0, lockUntil: 0 };
    
    if (attempt.lockUntil > now) {
        const remainingMin = Math.ceil((attempt.lockUntil - now) / 60000);
        return res.status(429).json({ success: false, error: `Слишком много попыток. Заблокировано на ${remainingMin} мин.` });
    }

    const { password } = req.body;
    if (password && password === ADMIN_PASSWORD) {
        authAttempts.delete(ip);
        return res.json({ success: true, token: ADMIN_PASSWORD });
    }
    
    attempt.count += 1;
    if (attempt.count >= 5) {
        attempt.lockUntil = now + 15 * 60 * 1000; // 15 minutes lockout
        console.warn(`[SECURITY] IP ${ip} locked out for 15 minutes due to failed login attempts.`);
    }
    authAttempts.set(ip, attempt);

    return res.status(401).json({ success: false, error: 'Неверный секретный ключ' });
});

app.get('/api/auth/check', (req, res) => {
    const key = req.headers['x-admin-key'];
    res.json({ isOwner: key === ADMIN_PASSWORD });
});

// Admin Migration / Restore Endpoints
app.post('/api/admin/restore-db', authMiddleware, upload.single('database'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No database file provided' });
    const targetDbPath = path.resolve(dataDir, 'database.sqlite');
    try {
        fs.copyFileSync(req.file.path, targetDbPath);
        try { fs.unlinkSync(req.file.path); } catch(e){}
        res.json({ success: true, message: 'Database successfully restored!' });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

const syncStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const uploadSyncMedia = multer({ storage: syncStorage });

app.post('/api/admin/upload-file', authMiddleware, uploadSyncMedia.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    res.json({ success: true, filename: req.file.filename });
});

// Get settings (Public)
app.get('/api/settings', (req, res) => {
    initBot();
    const templatePath = path.join(__dirname, 'telegram_template.txt');
    let template = '';
    if (fs.existsSync(templatePath)) {
        try { template = fs.readFileSync(templatePath, 'utf8'); } catch(e){}
    }
    res.json({
        botToken: botToken ? botToken.substring(0, 8) + '...' : '',
        channelId: channelId || '',
        telegramTemplate: template
    });
});

// Update settings (Owner Protected)
app.put('/api/settings', authMiddleware, (req, res) => {
    const { botToken: newToken, channelId: newChannelId, telegramTemplate: newTemplate } = req.body;
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    let botTokenUpdated = false;
    let channelIdUpdated = false;
    
    const lines = envContent.split(/\r?\n/);
    const newLines = lines.map(line => {
        if (line.trim().startsWith('BOT_TOKEN=')) {
            botTokenUpdated = true;
            return `BOT_TOKEN=${newToken}`;
        }
        if (line.trim().startsWith('CHANNEL_ID=')) {
            channelIdUpdated = true;
            return `CHANNEL_ID=${newChannelId}`;
        }
        return line;
    });
    
    if (!botTokenUpdated) newLines.push(`BOT_TOKEN=${newToken}`);
    if (!channelIdUpdated) newLines.push(`CHANNEL_ID=${newChannelId}`);
    
    try {
        fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
        
        if (typeof newTemplate === 'string') {
            const templatePath = path.join(__dirname, 'telegram_template.txt');
            fs.writeFileSync(templatePath, newTemplate, 'utf8');
        }
        
        initBot();
        res.json({ success: true, botToken, channelId });
    } catch (e) {
        console.error('Error writing settings:', e);
        res.status(500).json({ error: 'Failed to write settings' });
    }
});

// Get all tags (Public)
app.get('/api/tags', (req, res) => {
    db.all("SELECT * FROM tags", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create tag (Owner Protected)
app.post('/api/tags', authMiddleware, (req, res) => {
    const { name, color } = req.body;
    db.run("INSERT INTO tags (name, color) VALUES (?, ?)", [name, color || '#3b82f6'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, color: color || '#3b82f6' });
    });
});

// Get all tasks (Public)
app.get('/api/tasks', (req, res) => {
    db.all("SELECT * FROM tasks ORDER BY status DESC, position ASC, created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(r => {
            if (r.images_json) { try { r.images = JSON.parse(r.images_json); } catch(e) { r.images = []; } }
            else if (r.image_url) { r.images = [r.image_url]; }
            else { r.images = []; }
            
            if (r.tags_json) { try { r.tags = JSON.parse(r.tags_json); } catch(e) { r.tags = []; } }
            else { r.tags = []; }
        });
        res.json(rows);
    });
});

// Create task (Owner Protected)
app.post('/api/tasks', authMiddleware, upload.array('images', 5), (req, res) => {
    const { title, description, difficulty, tags, parent_id } = req.body;
    let images = [];
    if (req.files && req.files.length > 0) {
        images = req.files.map(f => `/uploads/${f.filename}`);
    }
    const imagesJson = JSON.stringify(images);
    const tagsJson = tags || '[]';
    
    const initialStatus = parent_id ? 'locked' : 'todo';
    const query = `INSERT INTO tasks (title, description, images_json, difficulty, tags_json, status, position, parent_id) VALUES (?, ?, ?, ?, ?, ?, 9999, ?)`;
    db.run(query, [title, description, imagesJson, difficulty || 1, tagsJson, initialStatus, parent_id || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Bulk update positions and status (Owner Protected)
app.put('/api/tasks/positions', authMiddleware, (req, res) => {
    const { updates } = req.body;
    const ids = updates.map(u => u.id);
    if (ids.length === 0) return res.json({ success: true });

    db.all(`SELECT id, status FROM tasks WHERE id IN (${ids.join(',')})`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const oldStatuses = {};
        rows.forEach(r => oldStatuses[r.id] = r.status);
        
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            updates.forEach(u => {
                let query = "UPDATE tasks SET position = ?, status = ?";
                let params = [u.position, u.status];
                if (u.status === 'done' && oldStatuses[u.id] !== 'done') {
                    query += ", completed_at = CURRENT_TIMESTAMP";
                }
                if (u.status !== 'todo') {
                    query += ", group_id = NULL";
                }
                query += " WHERE id = ?";
                params.push(u.id);
                db.run(query, params);
            });
            db.run("COMMIT", (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                if (bot && channelId) {
                    updates.forEach(u => {
                        const oldStatus = oldStatuses[u.id];
                        if (u.status === 'done' && oldStatus !== 'done') {
                            db.get("SELECT * FROM tasks WHERE id = ?", [u.id], (err, t) => {
                                if (t) sendTelegramNotification(t);
                            });
                        } else if (u.status !== 'done' && oldStatus === 'done') {
                            db.get("SELECT * FROM tasks WHERE id = ?", [u.id], (err, t) => {
                                if (t) deleteTelegramMessages(t);
                            });
                        }
                    });
                }
                
                res.json({ success: true });
            });
        });
    });
});

// Update task status only (Owner Protected)
app.put('/api/tasks/:id/status', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    db.get("SELECT * FROM tasks WHERE id = ?", [id], async (err, task) => {
        if (err || !task) return res.status(404).json({ error: 'Task not found' });
        
        const oldStatus = task.status;
        
        let query = `UPDATE tasks SET status = ?`;
        let params = [status];
        if (status === 'done') query += `, completed_at = CURRENT_TIMESTAMP`;
        if (status !== 'todo') query += `, group_id = NULL`;
        query += ` WHERE id = ?`;
        params.push(id);
        
        db.run(query, params, async function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            db.get("SELECT * FROM tasks WHERE id = ?", [id], async (err, updatedTask) => {
                if (!err && updatedTask && bot && channelId) {
                    if (status === 'done' && oldStatus !== 'done') {
                        await sendTelegramNotification(updatedTask);
                    } else if (status !== 'done' && oldStatus === 'done') {
                        await deleteTelegramMessages(updatedTask);
                    }
                }
            });
            res.json({ success: true });
        });
    });
});

// Link task into a stack (Owner Protected)
app.put('/api/tasks/:id/link', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { parent_id: target_id } = req.body;
    
    if (!target_id) return res.status(400).json({ error: 'target_id is required' });
    
    db.get("SELECT * FROM tasks WHERE id = ?", [target_id], (err, targetTask) => {
        if (err || !targetTask) return res.status(404).json({ error: 'Target task not found' });
        
        if (targetTask.status !== 'todo') {
            return res.status(400).json({ error: 'Stacking is only allowed in the TODO column' });
        }
        
        let groupId = targetTask.group_id;
        if (!groupId) {
            groupId = Date.now().toString() + Math.random().toString().substring(2, 6);
            db.run("UPDATE tasks SET group_id = ? WHERE id = ?", [groupId, target_id]);
        }
        
        db.run("UPDATE tasks SET group_id = ?, position = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?", [groupId, targetTask.position - 1, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, group_id: groupId });
        });
    });
});

// Unlink task from group (Owner Protected)
app.put('/api/tasks/:id/unlink', authMiddleware, (req, res) => {
    const { id } = req.params;
    
    db.get("SELECT group_id FROM tasks WHERE id = ?", [id], (err, row) => {
        if (err || !row || !row.group_id) {
            return db.run("UPDATE tasks SET parent_id = NULL, group_id = NULL WHERE id = ?", [id], () => res.json({ success: true }));
        }
        
        const groupId = row.group_id;
        db.run("UPDATE tasks SET group_id = NULL, parent_id = NULL WHERE id = ?", [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            db.all("SELECT id FROM tasks WHERE group_id = ?", [groupId], (err, rows) => {
                if (!err && rows && rows.length === 1) {
                    db.run("UPDATE tasks SET group_id = NULL WHERE id = ?", [rows[0].id]);
                }
            });
            res.json({ success: true });
        });
    });
});

// Delete a task (Owner Protected)
app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM tasks WHERE id = ?", [id], async (err, task) => {
        if (err || !task) return res.status(404).json({ error: 'Task not found' });
        
        if (task.status === 'done' && bot && channelId) {
            await deleteTelegramMessages(task);
        }
        
        db.run("DELETE FROM tasks WHERE id = ?", [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Edit a task (Owner Protected)
app.put('/api/tasks/:id', authMiddleware, upload.array('images', 5), (req, res) => {
    const { id } = req.params;
    const { title, description, difficulty, tags } = req.body;
    
    let existingImages = req.body.existing_images || [];
    if (!Array.isArray(existingImages)) existingImages = [existingImages];
    
    let newImages = [];
    if (req.files && req.files.length > 0) {
        newImages = req.files.map(f => `/uploads/${f.filename}`);
    }
    
    const finalImages = [...existingImages, ...newImages];
    const finalImagesJson = JSON.stringify(finalImages);
    const tagsJson = tags || '[]';
    
    db.get("SELECT * FROM tasks WHERE id = ?", [id], async (err, task) => {
        if (err || !task) return res.status(404).json({ error: 'Task not found' });
        
        let oldImages = [];
        if (task.images_json) { try { oldImages = JSON.parse(task.images_json); } catch(e){} }
        else if (task.image_url) { oldImages = [task.image_url]; }
        
        const imagesChanged = JSON.stringify(oldImages) !== finalImagesJson;
        let diff = difficulty || task.difficulty;
        
        db.run(`UPDATE tasks SET title = ?, description = ?, difficulty = ?, images_json = ?, tags_json = ? WHERE id = ?`, 
        [title, description, diff, finalImagesJson, tagsJson, id], async function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            if (task.status === 'done' && bot && channelId) {
                db.get("SELECT * FROM tasks WHERE id = ?", [id], async (err, updatedTask) => {
                    if (imagesChanged) {
                        await deleteTelegramMessages(updatedTask);
                        await sendTelegramNotification(updatedTask);
                    } else {
                        const caption = getTelegramCaption(updatedTask);
                        let msgIds = [];
                        if (updatedTask.telegram_message_ids_json) {
                            try { msgIds = JSON.parse(updatedTask.telegram_message_ids_json); } catch(e){}
                        } else if (updatedTask.telegram_message_id) {
                            msgIds = [updatedTask.telegram_message_id];
                        }
                        
                        if (msgIds.length > 0) {
                            try {
                                if (finalImages.length > 0) {
                                    await bot.telegram.editMessageCaption(channelId, msgIds[0], undefined, caption, { parse_mode: 'HTML' });
                                } else {
                                    await bot.telegram.editMessageText(channelId, msgIds[0], undefined, caption, { parse_mode: 'HTML' });
                                }
                            } catch(e) { console.error('Error editing TG', e); }
                        }
                    }
                });
            }
            res.json({ success: true });
        });
    });
});

function getTelegramCaption(task) {
    const templatePath = path.join(__dirname, 'telegram_template.txt');
    let template = `<b>ТАСК ВЫПОЛНЕН</b>\n\n<b>Название:</b> {title}\n<b>Сложность:</b> {stars}\n{tags}\n<b>Описание:</b> {description}\n\n<i>Создана: {created_at}</i>\n<i>Выполнена: {completed_at}</i>`;
    if (fs.existsSync(templatePath)) {
        try {
            template = fs.readFileSync(templatePath, 'utf8');
        } catch(e) {
            console.error('Error reading telegram_template.txt', e);
        }
    }

    const diff = task.difficulty || 1;
    const stars = '★'.repeat(diff) + '☆'.repeat(3 - diff);
    
    let tagsStr = '';
    if (task.tags_json) {
        try {
            const tagsArr = JSON.parse(task.tags_json);
            if (tagsArr.length > 0) {
                tagsStr = `<b>Теги:</b> ${tagsArr.map(t => '#' + t.name.replace(/\s+/g, '_')).join(' ')}\n`;
            }
        } catch(e) {}
    }

    const dateOpts = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const createdAtStr = new Date(task.created_at).toLocaleString('ru-RU', dateOpts);
    const completedAtStr = task.completed_at ? new Date(task.completed_at).toLocaleString('ru-RU', dateOpts) : '';
    
    let caption = template
        .replace(/{title}/g, task.title)
        .replace(/{stars}/g, stars)
        .replace(/{tags}/g, tagsStr)
        .replace(/{description}/g, task.description || 'Нет описания')
        .replace(/{created_at}/g, createdAtStr)
        .replace(/{completed_at}/g, completedAtStr);
        
    return caption;
}

async function deleteTelegramMessages(task) {
    let msgIds = [];
    if (task.telegram_message_ids_json) {
        try { msgIds = JSON.parse(task.telegram_message_ids_json); } catch(e){}
    } else if (task.telegram_message_id) {
        msgIds = [task.telegram_message_id];
    }
    
    for (let msgId of msgIds) {
        try { await bot.telegram.deleteMessage(channelId, msgId); } catch(e) {}
    }
}

function isVideo(url) {
    return !!url.match(/\.(mp4|webm|mov|mkv)$/i);
}

async function sendTelegramNotification(task) {
    try {
        const caption = getTelegramCaption(task);
        let images = [];
        if (task.images_json) { try { images = JSON.parse(task.images_json); } catch(e){} }
        else if (task.image_url) { images = [task.image_url]; }

        let msgIds = [];
        
        if (images.length === 0) {
            const sent = await bot.telegram.sendMessage(channelId, caption, { parse_mode: 'HTML' });
            if (sent) msgIds.push(sent.message_id);
        } else if (images.length === 1) {
            const imageRelPath = images[0].replace(/^\/uploads\//, '');
            const imagePath = path.join(uploadsDir, imageRelPath);
            if (fs.existsSync(imagePath)) {
                let sent;
                if (isVideo(images[0])) {
                    sent = await bot.telegram.sendVideo(channelId, { source: imagePath }, { caption: caption, parse_mode: 'HTML' });
                } else {
                    sent = await bot.telegram.sendPhoto(channelId, { source: imagePath }, { caption: caption, parse_mode: 'HTML' });
                }
                if (sent) msgIds.push(sent.message_id);
            } else {
                const sent = await bot.telegram.sendMessage(channelId, caption, { parse_mode: 'HTML' });
                if (sent) msgIds.push(sent.message_id);
            }
        } else {
            const media = [];
            for (let i = 0; i < images.length; i++) {
                const imageRelPath = images[i].replace(/^\/uploads\//, '');
                const imagePath = path.join(uploadsDir, imageRelPath);
                if (fs.existsSync(imagePath)) {
                    let m = { type: isVideo(images[i]) ? 'video' : 'photo', media: { source: imagePath } };
                    if (i === 0) { m.caption = caption; m.parse_mode = 'HTML'; }
                    media.push(m);
                }
            }
            if (media.length > 0) {
                const sentArr = await bot.telegram.sendMediaGroup(channelId, media);
                if (sentArr && Array.isArray(sentArr)) msgIds = sentArr.map(m => m.message_id);
            } else {
                const sent = await bot.telegram.sendMessage(channelId, caption, { parse_mode: 'HTML' });
                if (sent) msgIds.push(sent.message_id);
            }
        }
        
        if (msgIds.length > 0) {
            db.run(`UPDATE tasks SET telegram_message_ids_json = ? WHERE id = ?`, [JSON.stringify(msgIds), task.id]);
        }
    } catch (error) { console.error('Error sending Telegram notification:', error); }
}

// Backups
function backupDatabase() {
    const dbPath = path.resolve(dataDir, 'database.sqlite');
    if (fs.existsSync(dbPath)) {
        const date = new Date();
        const timestamp = date.toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupsDir, `database_backup_${timestamp}.sqlite`);
        
        fs.copyFile(dbPath, backupPath, (err) => {
            if (!err) {
                console.log(`Успешный бекап базы данных: ${backupPath}`);
                cleanOldBackups(backupsDir);
            }
        });
    }
}

function cleanOldBackups(dir) {
    fs.readdir(dir, (err, files) => {
        if (err) return;
        const backups = files.filter(f => f.startsWith('database_backup_') && f.endsWith('.sqlite'));
        if (backups.length > 7) {
            backups.sort();
            const toDelete = backups.slice(0, backups.length - 7);
            toDelete.forEach(file => fs.unlink(path.join(dir, file), () => {}));
        }
    });
}

// Health check endpoint for Railway / Cloud proxies
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
    backupDatabase();
    setInterval(backupDatabase, 24 * 60 * 60 * 1000);
});
