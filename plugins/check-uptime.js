const { cmd } = require('../command');
const config = require('../config');
const { runtime } = require('../lib/functions');
const os = require('os');

cmd({
    pattern: "uptime",
    alias: ["runtime", "up"],
    desc: "Check bot uptime and system stats",
    category: "main",
    react: "⏱️",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const uptime = runtime(process.uptime());
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const platform = os.platform();
        const botName = config.BOT_NAME || "BOT";

        const text = `*${botName}*\n━━━━━━━━━━━━━━━━━━\nUptime: ${uptime}\nRAM: ${ram} MB / ${totalRam} GB\nPlatform: ${platform}\n━━━━━━━━━━━━━━━━━━\n> ${config.DESCRIPTION || 'Powered by ' + botName}`;
        reply(text);
    } catch (e) {
        reply("Error getting uptime.");
    }
});
