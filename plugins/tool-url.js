const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { cmd } = require("../command");

cmd({
    pattern: "tourl",
    alias: ["imgtourl", "imgurl", "url", "geturl", "upload"],
    react: "🔗",
    desc: "Upload media and get direct URL",
    category: "utility",
    use: ".tourl [reply media]",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const quoted = mek.quoted ? mek.quoted : mek;
        const mime = (quoted.msg || quoted).mimetype || "";

        if (!mime) {
            return reply("❌ Reply to an image, video, audio or document.");
        }

        const buffer = await quoted.download();

        let ext = ".bin";

        if (mime.includes("jpeg")) ext = ".jpg";
        else if (mime.includes("png")) ext = ".png";
        else if (mime.includes("webp")) ext = ".webp";
        else if (mime.includes("gif")) ext = ".gif";
        else if (mime.includes("mp4")) ext = ".mp4";
        else if (mime.includes("mp3")) ext = ".mp3";
        else if (mime.includes("pdf")) ext = ".pdf";
        else if (mime.includes("zip")) ext = ".zip";

        const tempFile = path.join(
            os.tmpdir(),
            `upload_${Date.now()}${ext}`
        );

        fs.writeFileSync(tempFile, buffer);

        const form = new FormData();
        form.append("file", fs.createReadStream(tempFile));

        const { data } = await axios.post(
            "https://eliteprotech-url.zone.id/api/upload",
            form,
            {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );

        fs.unlinkSync(tempFile);

        if (!data.success) {
            return reply("❌ Upload failed!");
        }

        let type = "📁 File";

        if (mime.includes("image")) type = "🖼️ Image";
        else if (mime.includes("video")) type = "🎥 Video";
        else if (mime.includes("audio")) type = "🎵 Audio";
        else if (mime.includes("pdf")) type = "📄 PDF";

        const text = `
╭━━━〔 *🔗 URL UPLOADER* 〕━━━⬣
┃
┃ ${type}
┃ 📏 *Size:* ${formatBytes(data.size)}
┃ 📂 *Name:* ${data.original_name}
┃
┃ 🌐 *Direct URL*
┃ ${data.public_url}
┃
╰━━━━━━━━━━━━━━⬣

> ✨ Uploaded Successfully
> 𓆩𝐙𝐀𝐈𝐃𝐈-𝐌𝐃𓆪
`;

        await conn.sendMessage(
            from,
            {
                text,
                contextInfo: {
                    externalAdReply: {
                        title: "𓆩𝐙𝐀𝐈𝐃𝐈-𝐌𝐃𓆪",
                        body: "🔗 Media Uploaded Successfully",
                        thumbnailUrl: data.public_url,
                        sourceUrl: data.public_url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: mek }
        );

    } catch (err) {
        console.error(err);
        return reply(`❌ Error: ${err.message || err}`);
    }
});

function formatBytes(bytes) {
    if (!bytes) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
        parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
        " " +
        sizes[i]
    );
    }
