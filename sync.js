require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

let targetUrl = process.argv[2];
if (!targetUrl) {
    console.error('❌ Ошибка: Укажите URL развернутого проекта Railway.');
    console.log('Использование: node sync.js https://disposal-log-production.up.railway.app');
    process.exit(1);
}

targetUrl = targetUrl.replace(/\/$/, '');
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

console.log(`🚀 Начинаем синхронизацию данных с ПК на Railway (${targetUrl})...`);

const dbPath = path.join(__dirname, 'database.sqlite');
const uploadsDir = path.join(__dirname, 'uploads');

function uploadFile(endpoint, filePath, fieldName = 'file') {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) return resolve(null);
        
        const filename = path.basename(filePath);
        const fileData = fs.readFileSync(filePath);
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        
        const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
        const payload = Buffer.concat([header, fileData, footer]);
        
        const urlObj = new URL(targetUrl + endpoint);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(urlObj, {
            method: 'POST',
            headers: {
                'x-admin-key': adminPassword,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': payload.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function runSync() {
    try {
        if (fs.existsSync(dbPath)) {
            console.log('📦 Выгрузка локальной базы данных SQLite (database.sqlite)...');
            await uploadFile('/api/admin/restore-db', dbPath, 'database');
            console.log('✅ База данных успешно восстановлена на Railway!');
        }

        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir).filter(f => f !== '.gitkeep');
            console.log(`🖼️ Найдено медиафайлов для выгрузки: ${files.length}`);
            for (let i = 0; i < files.length; i++) {
                const fPath = path.join(uploadsDir, files[i]);
                console.log(` [${i + 1}/${files.length}] Выгрузка: ${files[i]}...`);
                await uploadFile('/api/admin/upload-file', fPath, 'file');
            }
            console.log('✅ Все медиафайлы успешно перенесены на Railway Volume!');
        }

        console.log('\n🎉 СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА! Все задачи, подзадачи и файлы с ПК доступны онлайн на Railway.');
    } catch (e) {
        console.error('❌ Ошибка при синхронизации:', e.message);
    }
}

runSync();
