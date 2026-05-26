// All settings commands have been moved to plugins/settings.js
// This file only keeps commands that are unique to this file.

const { cmd } = require('../command');
const config = require('../config');

// .goodbye — kept here as it has unique logic separate from .welcome
cmd({
    pattern: "goodbye",
    alias: ["setgoodbye"],
    react: "✅",
    desc: "Enable or disable goodbye messages for members leaving groups",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, isOwner, reply }) => {
    if (!isCreator && !isOwner) return reply("*📛 Only the owner can use this command!*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.GOODBYE = "true";
        return reply("✅ Goodbye messages are now enabled.");
    } else if (status === "off") {
        config.GOODBYE = "false";
        return reply("❌ Goodbye messages are now disabled.");
    } else {
        return reply(`Example: .goodbye on`);
    }
});
