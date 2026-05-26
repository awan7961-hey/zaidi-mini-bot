const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "repo",
    alias: ["source", "git"],
    desc: "Get bot source code info",
    category: "main",
    react: "📦",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    const botName = config.BOT_NAME || "BOT";
    const text = `*${botName}*\n━━━━━━━━━━━━━━━━━━\nBot: ${botName}\nOwner: ${config.OWNER_NAME || "Owner"}\nVersion: 5.0.0\n━━━━━━━━━━━━━━━━━━\n> ${config.DESCRIPTION || 'Powered by ' + botName}`;
    reply(text);
});
