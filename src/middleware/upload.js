const multer = require('multer');
const path = require('path');
const config = require('../config');

const ALLOWED_MIME = /^(image\/(png|jpeg|jpg|webp|gif)|video\/(mp4|webm|quicktime))$/;
const ALLOWED_EXT = /^\.(png|jpeg|jpg|webp|gif|mp4|webm|mov)$/i;

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

module.exports = multer({
    storage,
    limits: { fileSize: config.uploadMaxBytes },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME.test(file.mimetype) && ALLOWED_EXT.test(path.extname(file.originalname))) {
            return cb(null, true);
        }
        const err = new Error('Загрузка отклонена: разрешены только изображения (PNG, JPG, WEBP, GIF) и видео (MP4, WEBM, MOV).');
        err.status = 400;
        cb(err);
    }
});
