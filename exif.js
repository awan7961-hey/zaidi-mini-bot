const fs = require('fs');
const path = require('path');

const writeExif = async (media, options = {}) => {
    try {
        const tmpFile = path.join(require('os').tmpdir(), 'sticker_' + Date.now() + '.webp');
        
        if (Buffer.isBuffer(media.data)) {
            fs.writeFileSync(tmpFile, media.data);
        } else if (typeof media.data === 'string') {
            fs.writeFileSync(tmpFile, Buffer.from(media.data, 'base64'));
        }
        
        return tmpFile;
    } catch (e) {
        console.error('[Exif Error]', e.message);
        throw e;
    }
};

const writeExifImg = async (buff, options = {}) => {
    try {
        const tmpFile = path.join(require('os').tmpdir(), 'sticker_img_' + Date.now() + '.webp');
        if (Buffer.isBuffer(buff)) {
            fs.writeFileSync(tmpFile, buff);
        }
        return tmpFile;
    } catch(e) {
        console.error('[ExifImg Error]', e.message);
        throw e;
    }
};

const writeExifVid = async (buff, options = {}) => {
    try {
        const tmpFile = path.join(require('os').tmpdir(), 'sticker_vid_' + Date.now() + '.webp');
        if (Buffer.isBuffer(buff)) {
            fs.writeFileSync(tmpFile, buff);
        }
        return tmpFile;
    } catch(e) {
        console.error('[ExifVid Error]', e.message);
        throw e;
    }
};

module.exports = { writeExif, writeExifImg, writeExifVid };
