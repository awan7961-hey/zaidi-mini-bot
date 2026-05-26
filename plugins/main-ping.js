const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    use: '.ping',
    desc: "Check bot response speed",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const start = Date.now();
        await conn.sendMessage(from, { react: { text: '⚡', key: mek.key } });
        const ms = Date.now() - start;
        const botName = config.BOT_NAME || "BOT";

        await conn.sendMessage(from, {
            text: `*${botName}*\n━━━━━━━━━━━━━━━━\nPing: ${ms}ms ⚡\nStatus: Online ✅\n━━━━━━━━━━━━━━━━\n> ${config.DESCRIPTION || 'Powered by ' + botName}`,
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
        reply(`Ping error: ${e.message}`);
    }
});
