const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "creator",
    alias: ["owner", "dev"],
    desc: "Show bot owner/creator info",
    category: "main",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    const botName = config.BOT_NAME || "BOT";
    const text = `*${botName}*\n━━━━━━━━━━━━━━━━━━\nBot Owner: ${config.OWNER_NAME || "Owner"}\nNumber: ${config.OWNER_NUMBER || "N/A"}\n━━━━━━━━━━━━━━━━━━\n> ${config.DESCRIPTION || 'Powered by ' + botName}`;
    reply(text);
});
