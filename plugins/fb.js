const { cmd } = require('../command');
const axios = require('axios');

/* ================= FB VIDEO ================= */
cmd({
    pattern: "fb",
    alias: ["facebook", "fbdown"],
    desc: "Download Facebook Video",
    category: "download",
    react: "🎥",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) return reply("❌ Facebook link do!");

        const url = args[0];

        const api = `https://arslan-apis-v2.vercel.app/download/fbdown?url=${url}`;
        const res = await axios.get(api);

        if (!res.data.status || !res.data.result.status) {
            return reply("❌ Video fetch nahi ho saka!");
        }

        const data = res.data.result;

        const title = data.metadata.title || "Facebook Video";
        const duration = data.metadata.duration;

        const videoUrl = data.download.hd || data.download.sd;

        // UI
        let caption = `╭━━━〔 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐞𝐝 𓆩𝐙𝐀𝐈𝐃𝐈-𝐌𝐃𓆪 〕━━━⬣\n`;
        caption += `🎬 *Title:* ${title}\n`;
        caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `╰━━━━━━━━━━━━━━━━━━━⬣`;

        // ❌ Thumbnail removed
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: caption
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ Error a gaya!");
    }
});


/* ================= FB DOCUMENT ================= */
cmd({
    pattern: "fbdoc",
    desc: "Facebook Video as Document",
    category: "download",
    react: "📄",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) return reply("❌ Link do!");

        const api = `https://arslan-apis-v2.vercel.app/download/fbdown?url=${args[0]}`;
        const res = await axios.get(api);

        const videoUrl = res.data.result.download.hd || res.data.result.download.sd;

        await conn.sendMessage(from, {
            document: { url: videoUrl },
            mimetype: "video/mp4",
            fileName: "ZAIDI-MD-FB.mp4",
            caption: "> 📄 𝐃𝐎𝐂𝐔𝐌𝐄𝐍𝐓 𝐛𝐲 𓆩𝐙𝐀𝐈𝐃𝐈-𝐌𝐃𓆪"
        }, { quoted: mek });

    } catch {
        reply("❌ Error!");
    }
});


/* ================= FB MP3 ================= */
cmd({
    pattern: "fbmp3",
    desc: "Facebook Video to Audio",
    category: "download",
    react: "🎧",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) return reply("❌ Link do!");

        const api = `https://arslan-apis-v2.vercel.app/download/fbdown?url=${args[0]}`;
        const res = await axios.get(api);

        const videoUrl = res.data.result.download.hd || res.data.result.download.sd;

        await conn.sendMessage(from, {
            audio: { url: videoUrl },
            mimetype: "audio/mpeg",
            ptt: false
        }, { quoted: mek });

    } catch {
        reply("❌ Error!");
    }
});
