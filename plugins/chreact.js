const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "chreact",
  alias: ["creact", "reactchannel"],
  react: "🔥",
  desc: "Send multiple reactions to WhatsApp channel post",
  category: "whatsapp",
  filename: __filename
}, async (conn, mek, m, {
  from,
  args,
  q,
  reply
}) => {
  try {
    // Show help if no arguments
    if (!q || args.length < 2) {
      return reply(`❌ *Invalid Usage!*

*Command:* .chreact <whatsapp_post_url> <emoji1> <emoji2> ...

*Example:* 
.chreact https://whatsapp.com/channel/0029VbDDR6PFMqrOMnpSiA0s/104 💋 🫠 🥵 🥰

*Supports:* Multiple emojis (space separated)

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𓆩𝐙𝐀𝐈𝐃𝐈-𝐌𝐃𓆪*`);
    }

    // Extract URL and emojis
    const postUrl = args[0];
    const emojis = args.slice(1);

    // Validate URL format
    if (!postUrl.includes("whatsapp.com/channel/")) {
      return reply(`❌ *Invalid URL!*

*Valid Format:* 
https://whatsapp.com/channel/CHANNEL_ID/POST_ID

*Example:* 
https://whatsapp.com/channel/0029VbDDR6PFMqrOMnpSiA0s/104

❌ *Wrong Format:* 
https://whatsapp.com/channel/channlink (missing post ID)

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𓆩𝐙𝐀𝐈𝐃𝐈-𝐌𝐃𓆪*`);
    }

    // Extract channel ID and post ID
    const parts = postUrl.split("/");
    const postId = parts[parts.length - 1];
    const channelId = parts[parts.length - 2];

    // Validate post ID is a number
    if (!postId || isNaN(postId)) {
      return reply(`❌ *Invalid URL!*

*Missing Post ID!*

*Correct Format:* 
https://whatsapp.com/channel/CHANNEL_ID/POST_ID

*Example:* 
https://whatsapp.com/channel/0029VbDDR6PFMqrOMnpSiA0s/104

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𓆩𝐙𝐀𝐈𝐃𝐈-𝐌𝐃𓆪*`);
    }

    // Send processing message
    await reply(`⏳ *Sending reactions...*

📌 *Channel:* ${channelId}
📝 *Post:* ${postId}
😊 *Emojis:* ${emojis.join(" ")}

*Please wait...*`);

    // Call the ChReact API
    const emojiString = emojis.join(" ");
    const response = await axios.post("https://asitha.top/chreact", {
      url: postUrl,
      emojis: emojiString
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    });

    const totalServers = 7;

    // Send success response
    await reply(`✅ *Reactions sent successfully!*

📊 *Details:*
🎯 *Channel ID:* ${channelId}
📝 *Post ID:* ${postId}
😊 *Emojis:* ${emojis.join(" ")}
🌐 *All ${totalServers} servers*
📡 *Requests Sent:* ${totalServers}

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𓆩𝐙𝐀𝐈𝐃𝐈-𝐌𝐃𓆪*`);

  } catch (error) {
    console.error("❌ Error in .chreact plugin:", error);
    
    let errorMsg = error.response?.data?.message || error.message;
    
    reply(`❌ *Failed to send reactions!*

*Error:* ${errorMsg}

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𓆩𝐙𝐀𝐈𝐃𝐈-𝐌𝐃𓆪*`);
  }
});
