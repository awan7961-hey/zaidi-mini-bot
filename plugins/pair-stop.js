const { cmd } = require('../command');

// Global flag
let pairingActive = true;

cmd({
    pattern: "pairstop",
    react: "🛑",
    desc: "Stop pairing process",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    pairingActive = false;
    return reply("🛑 Pairing process stopped successfully.");
});

// Export flag so other files can use it
module.exports = { pairingActive };
