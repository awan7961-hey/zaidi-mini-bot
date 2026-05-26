const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "welcomeimg",
    alias: ["welimg", "welcomeimg", "welc", "welcomecard"],
    desc: "Generate fully customizable welcome image",
    category: "maker",
    react: "👋",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender, isGroup }) => {
    try {
        if (!q) return await reply(`👋 *WELCOME IMAGE GENERATOR*\n\n*━━━━━ FORMATS ━━━━━*\n\n*1️⃣ Simple:*\n.welcome username\n\n*2️⃣ With Group Name:*\n.welcome username | groupName\n\n*3️⃣ Full Details:*\n.welcome username | groupName | memberCount\n\n*4️⃣ Custom Avatar:*\n.welcome username | groupName | memberCount | avatarURL\n\n*5️⃣ Custom Avatar + Background:*\n.welcome username | groupName | memberCount | avatarURL | backgroundURL\n\n*━━━━━ EXAMPLES ━━━━━*\n\n.welcome Ahmad\n.welcome Ahmad | DARKZONE\n.welcome Ahmad | DARKZONE | 500\n.welcome Ahmad | DARKZONE | 500 | avatarURL\n.welcome Ahmad | DARKZONE | 500 | avatarURL | bgURL\n\n*━━━━━ REPLY METHOD ━━━━━*\n\n*Reply to an image for avatar:*\n.welcome Ahmad | DARKZONE | 500 | reply\n\n*Reply to image for background:*\n.welcome Ahmad | DARKZONE | 500 | avatarURL | reply\n\n> *DARKZONE-MD*`);

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Parse input
        const args = q.split("|").map(arg => arg.trim());
        
        const username = args[0] || "User";
        const guildName = args[1] || "DARKZONE-MD";
        const memberCount = args[2] || "100";
        let avatarUrl = args[3] || null;
        let backgroundUrl = args[4] || null;

        // Default URLs
        const defaultAvatar = "https://api.deline.web.id/Uy4yBXYUSd.jpg";
        const defaultBg = "https://api.deline.web.id/Eu3BVf3K4x.jpg";

        // Check if quoted message has image
        let quotedImageUrl = null;
        if (m.quoted && (m.quoted.type === 'imageMessage' || m.quoted.message?.imageMessage)) {
            try {
                const buffer = await m.quoted.download();
                const base64 = buffer.toString('base64');
                const uploadRes = await axios.post('https://telegra.ph/upload', {
                    file: `data:image/jpeg;base64,${base64}`
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });
                if (uploadRes.data && uploadRes.data[0]) {
                    quotedImageUrl = 'https://telegra.ph' + uploadRes.data[0].src;
                }
            } catch (err) {
                // If upload fails, continue without quoted image
            }
        }

        // Handle avatar URL
        if (!avatarUrl || avatarUrl.toLowerCase() === "reply") {
            if (quotedImageUrl && (!backgroundUrl || backgroundUrl.toLowerCase() !== "reply")) {
                avatarUrl = quotedImageUrl;
            } else {
                try {
                    let targetJid = m.quoted ? m.quoted.sender : sender;
                    avatarUrl = await conn.profilePictureUrl(targetJid, 'image');
                } catch {
                    avatarUrl = defaultAvatar;
                }
            }
        } else if (!avatarUrl.startsWith("http")) {
            try {
                avatarUrl = await conn.profilePictureUrl(sender, 'image');
            } catch {
                avatarUrl = defaultAvatar;
            }
        }

        // Handle background URL
        if (!backgroundUrl) {
            backgroundUrl = defaultBg;
        } else if (backgroundUrl.toLowerCase() === "reply") {
            if (quotedImageUrl) {
                backgroundUrl = quotedImageUrl;
            } else {
                backgroundUrl = defaultBg;
            }
        } else if (!backgroundUrl.startsWith("http")) {
            backgroundUrl = defaultBg;
        }

        // Call API
        const api = `https://api.deline.web.id/canvas/welcome?username=${encodeURIComponent(username)}&guildName=${encodeURIComponent(guildName)}&memberCount=${encodeURIComponent(memberCount)}&avatar=${encodeURIComponent(avatarUrl)}&background=${encodeURIComponent(backgroundUrl)}&quality=99`;
        
        const res = await axios.get(api, { responseType: 'arraybuffer' });

        // Send generated image
        await conn.sendMessage(from, {
            image: Buffer.from(res.data),
            caption: `> WELCOME IMAGE GENERATOR 👋\n\n*STYLISH WELCOME CARD*\n╭━━━━━━━━━━━━━━━━╮\n┇๏ *Username* - ${username}\n┇๏ *Group* - ${guildName}\n┇๏ *Members* - ${memberCount}\n┇๏ *Avatar* - Custom ✅\n┇๏ *Background* - Custom ✅\n╰━━━━━━━━━━━━━━━━╯\n\n> *DARKZONE-MD*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in Welcome Image:", e);
        await reply("❌ Error occurred, please try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
