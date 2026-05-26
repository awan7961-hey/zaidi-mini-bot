const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============ AUTO CLEAN EVERY 10 MINUTES ============
setInterval(() => {
    try {
        const tmpDir = path.join(os.tmpdir(), 'cache-temp');
        if (fs.existsSync(tmpDir)) {
            const files = fs.readdirSync(tmpDir);
            for (const file of files) {
                try { fs.unlinkSync(path.join(tmpDir, file)); } catch(e) {}
            }
        }
        // Clean old session temp files
        const sessDir = path.join(__dirname, '..', 'sessions');
        if (fs.existsSync(sessDir)) {
            const files = fs.readdirSync(sessDir);
            files.forEach(f => {
                if (f.endsWith('.tmp') || f.endsWith('.bak')) {
                    try { fs.unlinkSync(path.join(sessDir, f)); } catch(e) {}
                }
            });
        }
        if (global.gc) global.gc();
        console.log('[\uD83E\uDDF9] Auto Clean Done');
    } catch(e) {
        console.error('[\uD83E\uDDF9] Auto Clean Error:', e.message);
    }
}, 10 * 60 * 1000);

// ============ CLEAN COMMAND ============
cmd({
    pattern: "clean",
    alias: ["clear", "cleanup", "gc"],
    desc: "Clean temp files and free memory",
    category: "system",
    react: "\uD83E\uDDF9",
    filename: __filename
}, async (conn, mek, m, { reply, isOwner }) => {
    if (!isOwner) return reply("\u274C Only Owner Can Use This");
    try {
        const tmpDir = path.join(os.tmpdir(), 'cache-temp');
        let cleaned = 0;
        if (fs.existsSync(tmpDir)) {
            const files = fs.readdirSync(tmpDir);
            files.forEach(f => {
                try { fs.unlinkSync(path.join(tmpDir, f)); cleaned++; } catch(e) {}
            });
        }
        if (global.gc) global.gc();
        const mem = process.memoryUsage();
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        reply(`\uD83E\uDDF9 *AUTO CLEAN DONE*\n\n\uD83D\uDCC1 Files Cleaned: ${cleaned}\n\uD83D\uDCBE Memory: ${(mem.heapUsed/1024/1024).toFixed(1)}MB / ${(mem.heapTotal/1024/1024).toFixed(1)}MB\n\u23F1\uFE0F Uptime: ${hours}h ${mins}m\n\uD83D\uDD04 RSS: ${(mem.rss/1024/1024).toFixed(1)}MB`);
    } catch(e) {
        reply("\u274C Error: " + e.message);
    }
});

// ============ SYSTEM STATUS COMMAND ============
cmd({
    pattern: "system",
    alias: ["sys", "botstatus", "health"],
    desc: "Show bot system status",
    category: "system",
    react: "\uD83D\uDCCA",
    filename: __filename
}, async (conn, mek, m, { reply, isOwner }) => {
    if (!isOwner) return reply("\u274C Only Owner Can Use This");
    try {
        const mem = process.memoryUsage();
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        const secs = Math.floor(uptime % 60);
        
        reply(`\uD83D\uDCCA *SYSTEM STATUS*\n\n\u23F1\uFE0F Uptime: ${hours}h ${mins}m ${secs}s\n\uD83D\uDCBE Heap: ${(mem.heapUsed/1024/1024).toFixed(1)}MB / ${(mem.heapTotal/1024/1024).toFixed(1)}MB\n\uD83D\uDD04 RSS: ${(mem.rss/1024/1024).toFixed(1)}MB\n\uD83D\uDCE6 External: ${(mem.external/1024/1024).toFixed(1)}MB\n\uD83D\uDDA5\uFE0F Platform: ${process.platform} ${process.arch}\n\uD83D\uDCCC Node: ${process.version}\n\uD83D\uDD30 PID: ${process.pid}\n\n\u2705 Bot is running healthy!`);
    } catch(e) {
        reply("\u274C Error: " + e.message);
    }
});
