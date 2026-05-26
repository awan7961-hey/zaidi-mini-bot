const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../config.db.json');

function loadDB() {
    try {
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('[configdb] Load error:', e.message);
    }
    return {};
}

let db = loadDB();

function getConfig(key) {
    return db.hasOwnProperty(key) ? db[key] : null;
}

function setConfig(key, value) {
    db[key] = value;
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (e) {
        console.error('[configdb] Write error:', e.message);
    }
}

function getAllConfig() {
    return { ...db };
}

function resetConfig(key) {
    delete db[key];
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (e) {}
}

module.exports = { getConfig, setConfig, getAllConfig, resetConfig };
