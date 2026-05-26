const { cmd } = require('../command');
const os = require('os');
const config = require('../config');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "alive",
    alias: ["status", "a", "test"],
    react: "💚",
    desc: "Check if bot is online",
    category: "main",
    use: ".alive",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const ping = Date.now();
        const uptime = runtime(process.uptime());
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const botName = config.BOT_NAME || "BOT";
        const ownerName = config.OWNER_NAME || "Owner";
        const prefix = config.PREFIX || ".";
        const mode = config.MODE || "public";
        const responseTime = Date.now() - ping;

        const text = `*${botName}*
━━━━━━━━━━━━━━━━━━
Status: Online ✅
Ping: ${responseTime}ms
Uptime: ${uptime}
RAM: ${ram} MB
━━━━━━━━━━━━━━━━━━
Owner: ${ownerName}
Prefix: ${prefix}
Mode: ${mode}
━━━━━━━━━━━━━━━━━━
> ${config.DESCRIPTION || 'Powered by ' + botName}`;

        await conn.sendMessage(from, {
            image: { url: config.ALIVE_VID || config.MENU_IMAGE_URL },
            caption: text,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363423196146172@newsletter',
                    newsletterName: botName,
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("[Alive Error]:", e.message);
        reply("Bot is online! ✅");
    }
});
