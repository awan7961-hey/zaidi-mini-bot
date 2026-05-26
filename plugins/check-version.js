const axios = require('axios');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');

cmd({
  pattern: 'version',
  alias: ["changelog", "updatecheck"],
  react: '🚀',
  desc: "Check bot version & system info",
  category: 'info',
  filename: __filename
}, async (conn, mek, m, {
  from, pushname, reply
}) => {
  try {

    // ===== LOCAL VERSION =====
    let localVersion = "1.0.0";
    let changelog = "No changelog found";

    const filePath = path.join(__dirname, '../data/version.json');
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath));
        localVersion = data.version || localVersion;
        changelog = data.changelog || changelog;
      } catch {}
    }

    // ===== ONLINE VERSION =====
    let latestVersion = localVersion;
    let latestChangelog = changelog;

    try {
      const res = await axios.get(
        'https://raw.githubusercontent.com/me9900-say/ZaidiF-Md/main/data/version.json',
        { timeout: 5000 }
      );
      latestVersion = res.data.version || latestVersion;
      latestChangelog = res.data.changelog || latestChangelog;
    } catch {
      console.log("GitHub fetch failed (ignore)");
    }

    // ===== PLUGINS COUNT SAFE =====
    let pluginCount = 0;
    try {
      const pluginPath = path.join(__dirname, '../plugins');
      pluginCount = fs.readdirSync(pluginPath).filter(f => f.endsWith('.js')).length;
    } catch {}

    // ===== COMMANDS COUNT =====
    const totalCommands = commands.length;

    // ===== SYSTEM INFO =====
    const uptime = runtime(process.uptime());
    const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
    const host = os.hostname();

    let updateStatus = "✅ Bot is up-to-date";
    if (localVersion !== latestVersion) {
      updateStatus = `⚠️ Update Available\nCurrent: ${localVersion}\nLatest: ${latestVersion}`;
    }

    // ===== FINAL MESSAGE =====
    let msg = `
╭━━━〔 𓆩ZAIDI-MD𓆪 〕━━━⬣
┃ 👋 Hello ${pushname}
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 📊 BOT INFO 〕━━⬣
┃ 🤖 Name: 𓆩ZAIDI-MD𓆪
┃ 👑 Owner: ZAIDI-TEXK
┃ 🔖 Version: ${localVersion}
┃ 📢 Latest: ${latestVersion}
┃ 📂 Plugins: ${pluginCount}
┃ 🔢 Commands: ${totalCommands}
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 💻 SYSTEM 〕━━⬣
┃ ⏳ Uptime: ${uptime}
┃ 📟 RAM: ${ram}MB / ${totalRam}MB
┃ ⚙️ Host: ${host}
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 📝 CHANGELOG 〕━━⬣
${latestChangelog}
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 🌐 INFO 〕━━⬣
┃ 🔗 Repo: https://github.com/me9900-say/ZaidiF-Md
┃ 📡 Channel: 𓆩ZAIDI-MD𓆪
╰━━━━━━━━━━━━━━━━⬣

${updateStatus}
`;

    // ===== SEND MESSAGE =====
    await conn.sendMessage(from, {
      image: { url: 'https://files.catbox.moe/ejufwa.jpg' },
      caption: msg,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363423196146172@newsletter',
          newsletterName: '𓆩ZAIDI-MD𓆪',
          serverMessageId: 1
        }
      }
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("❌ Error in version command");
  }
});
