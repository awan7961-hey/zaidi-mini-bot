// TikTok2.js - Sirf API change, system same hai

const { cmd } = require('../command');
const axios = require('axios');

// ===== TikTok API (NEW - Faizan API) =====
async function tiktok(url) {
    try {
        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://faizan-api.vercel.app/api/tiktok?url=${encodedUrl}`;
        
        let res = await axios.get(apiUrl);
        
        // Faizan API response mein mp4 ya mp4_hd mein video hai
        let videoUrl = res.data.mp4_hd || res.data.mp4;
        
        return videoUrl || null;
    } catch (error) {
        console.log("TikTok API Error:", error.message);
        return null;
    }
}

cmd({
    pattern: "tiktok2",
    alias: ["tt2", "ttdl2"],
    desc: "Download TikTok video",
    category: "download",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {

    if (!args[0]) return reply("❌ TikTok link do");

    let url = args[0];

    if (!url.includes("tiktok.com")) {
        return reply("❌ Sirf TikTok link daalo");
    }

    reply("⏳ TikTok downloading...");

    let video = await tiktok(url);

    if (!video) return reply("❌ Download failed");

    return await conn.sendMessage(from, {
        video: { url: video },
        caption: "✅ TikTok Downloaded"
    }, { quoted: mek });
});
