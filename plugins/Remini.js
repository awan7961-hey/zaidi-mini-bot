const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { cmd } = require('../command');
const FormData = require('form-data');

cmd({
    pattern: "remini",
    alias: ["enhance", "hdimg"],
    react: "🪄",
    desc: "Enhance image quality using Remini AI",
    category: "image",
    use: ".remini (reply to image)",
    filename: __filename,
},
async (conn, mek, m, { from, quoted, reply }) => {
    try {
        // Must reply to image
        if (!quoted || !quoted.imageMessage) {
            return reply("🖼️ Please reply to an image with `.remini`");
        }

        await reply("⏳ Processing image, please wait...");

        // Download image from WhatsApp
        const stream = await downloadContentFromMessage(
            quoted.imageMessage,
            'image'
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Upload image to temporary hosting
        const form = new FormData();
        form.append('file', buffer, {
            filename: 'remini.jpg',
            contentType: 'image/jpeg'
        });

        const uploadRes = await axios.post(
            'https://tmpfiles.org/api/v1/upload',
            form,
            { headers: form.getHeaders() }
        );

        const imageUrl = uploadRes.data.data.url.replace(
            'tmpfiles.org/',
            'tmpfiles.org/dl/'
        );

        // Call NEW Remini API from prince techno
        const apiUrl = `https://api.princetechn.com/api/tools/remini?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(imageUrl)}`;

        const apiRes = await axios.get(apiUrl, { timeout: 60000 });
        const apiData = apiRes.data;

        // Validate API response
        if (!apiData.status || !apiData.result) {
            return reply("❌ Enhancement failed. API returned no image.");
        }

        // Send enhanced image
        await conn.sendMessage(
            from,
            {
                image: { url: apiData.result },
                caption: "✨ Image Enhanced Successfully!\n\n> ZAIDI TEXK-MD"
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("REMINI ERROR:", err);
        reply("❌ Image enhancement failed. Please try again.");
    }
});
