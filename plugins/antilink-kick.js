const { cmd } = require('../command');
const config = require("../config");

// Anti-Link System - Fixed Version
const linkPatterns = [
  /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
  /https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9_-]+/gi,
  /wa\.me\/\S+/gi,
  /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
  /https?:\/\/(?:www\.)?youtube\.com\/\S+/gi,
  /https?:\/\/youtu\.be\/\S+/gi,
  /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
  /https?:\/\/fb\.me\/\S+/gi,
  /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?tiktok\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?snapchat\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?pinterest\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
  /https?:\/\/ngl\.link\/\S+/gi,
  /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
  /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?medium\.com\/\S+/gi,
  /(?:www\.)?\w+\.(com|net|org|in|us|uk|ca|au|de|fr|jp)\/\S+/gi  // General URLs
];

cmd({
  pattern: "antilink",
  desc: "Toggle anti-link protection",
  category: "group",
  react: "🔗",
  fromMe: true
}, async (conn, m, store, {
  from,
  args,
  reply,
  isGroup
}) => {
  if (!isGroup) return reply("❌ This command can only be used in groups.");
  
  const currentStatus = global.ANTI_LINK_STATUS || false;
  
  if (args[0] === "on" || args[0] === "enable") {
    global.ANTI_LINK_STATUS = true;
    await reply("✅ Anti-link protection has been **ENABLED** for this group.\nUsers sending links will be removed.");
  } else if (args[0] === "off" || args[0] === "disable") {
    global.ANTI_LINK_STATUS = false;
    await reply("❌ Anti-link protection has been **DISABLED** for this group.");
  } else {
    await reply(`🔗 *Anti-Link System*\n\nStatus: ${currentStatus ? '✅ ENABLED' : '❌ DISABLED'}\n\nUsage:\n.antilink on - Enable protection\n.antilink off - Disable protection`);
  }
});

// Main anti-link handler
cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply
}) => {
  try {
    // Check conditions
    if (!isGroup) return;
    if (isAdmins) return; // Admins are exempt
    if (!isBotAdmins) return reply("❌ Bot is not admin, cannot remove users!");
    if (!global.ANTI_LINK_STATUS) return; // Anti-link disabled
    
    // Skip if no message body
    if (!body) return;
    
    // Check for links
    let containsLink = false;
    for (const pattern of linkPatterns) {
      if (pattern.test(body)) {
        containsLink = true;
        break;
      }
    }
    
    if (containsLink) {
      try {
        // Delete the message
        await conn.sendMessage(from, { delete: m.key });
        
        // Send warning and mention
        const warningMsg = `⚠️ *Link Detected!*\n\n@${sender.split('@')[0]} links are not allowed in this group.\nYou have been removed. 🚫`;
        
        await conn.sendMessage(from, {
          text: warningMsg,
          mentions: [sender]
        });
        
        // Remove user from group
        await conn.groupParticipantsUpdate(from, [sender], "remove");
        
        console.log(`Removed ${sender} for sending link in group ${from}`);
      } catch (err) {
        console.error("Error in anti-link action:", err);
        reply("❌ Failed to remove user. Make sure bot has admin privileges.");
      }
    }
  } catch (error) {
    console.error("Anti-link error:", error);
    // Don't reply to avoid spam
  }
});
