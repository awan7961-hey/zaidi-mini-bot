const { cmd } = require('../command');
const axios = require('axios');

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Terabox command
cmd({
    pattern: "terabox",
    alias: ["tb", "tera", "box"],
    react: "📦",
    desc: "Download files from Terabox",
    category: "download",
    use: ".terabox <terabox-url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) {
            return reply(`❀ Please send a Terabox link to download the file.\nExample: .terabox https://terabox.com/...`)
        }

        await react("⏳")
        await reply("🔄 Fetching Terabox file...")

        // Using Terabox official API
        const apiUrl = `https://terabox-downloader-api-ten.vercel.app/terabox?url=${encodeURIComponent(q)}`
        
        const { data } = await axios.get(apiUrl, { timeout: 15000 })

        // Check if API returned valid response
        if (!data || !data.success || !data.data) {
            await react("❌")
            return reply("❌ Failed to fetch Terabox data. Please check the link or try again later.")
        }

        const fileData = data.data
        
        // Get the best quality video or file
        let downloadUrl = null
        let fileName = fileData.title || "Terabox File"
        let fileSize = 0
        
        if (fileData.videos && fileData.videos.length > 0) {
            // For video files - get highest quality
            const video = fileData.videos[0]
            downloadUrl = video.url
            fileSize = video.size || 0
            fileName = fileName + ".mp4"
        } else if (fileData.files && fileData.files.length > 0) {
            // For other files
            const file = fileData.files[0]
            downloadUrl = file.url
            fileSize = file.size || 0
            fileName = file.name || fileName
        } else if (fileData.url) {
            // Direct URL
            downloadUrl = fileData.url
            fileSize = fileData.size || 0
        }

        if (!downloadUrl) {
            await react("❌")
            return reply("❌ No download link found for this Terabox file.")
        }

        // Size limit check (200MB limit for WhatsApp)
        const maxSize = 200 * 1024 * 1024
        if (fileSize > maxSize) {
            return reply(`❌ File is too large! Maximum size: 200MB\nYour file size: ${formatBytes(fileSize)}`)
        }

        await reply(`✅ File found!\n📄 Name: ${fileName}\n💾 Size: ${formatBytes(fileSize)}\n📥 Downloading and sending...`)

        // Download the file
        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        })

        // Determine file type from extension
        const extension = fileName.split('.').pop().toLowerCase()
        const mimeTypes = {
            'mp4': 'video/mp4',
            'mkv': 'video/x-matroska',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'pdf': 'application/pdf',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            'mp3': 'audio/mpeg',
            'm4a': 'audio/mp4'
        }
        
        let mimetype = mimeTypes[extension] || 'application/octet-stream'

        // Send file based on type
        if (mimetype.startsWith('video/')) {
            await conn.sendMessage(from, {
                video: Buffer.from(response.data),
                caption: `📥 *Downloaded from Terabox*\n📄 ${fileName}\n💾 ${formatBytes(fileSize)}`,
                fileName: fileName,
                mimetype: mimetype
            }, { quoted: m })
        } 
        else if (mimetype.startsWith('image/')) {
            await conn.sendMessage(from, {
                image: Buffer.from(response.data),
                caption: `📥 *Downloaded from Terabox*\n📄 ${fileName}\n💾 ${formatBytes(fileSize)}`,
                mimetype: mimetype
            }, { quoted: m })
        }
        else if (mimetype.startsWith('audio/')) {
            await conn.sendMessage(from, {
                audio: Buffer.from(response.data),
                mimetype: mimetype,
                fileName: fileName
            }, { quoted: m })
        }
        else {
            await conn.sendMessage(from, {
                document: Buffer.from(response.data),
                fileName: fileName,
                mimetype: mimetype,
                caption: `📥 *Downloaded from Terabox*\n📄 ${fileName}\n💾 ${formatBytes(fileSize)}`
            }, { quoted: m })
        }

        await react("✅")

    } catch (e) {
        console.error('Terabox Download Error:', e)
        await react("❌")
        
        if (e.code === 'ECONNABORTED') {
            reply("❌ Request timeout! The file might be too large or server is slow.")
        } else if (e.response && e.response.status === 404) {
            reply("❌ File not found! Please check the Terabox link.")
        } else {
            reply(`❌ An error occurred while downloading from Terabox.\n\nError: ${e.message}`)
        }
    }
})
