/**
 * MENU PLUGIN - Fixed event listener leak
 * Uses a global handler map instead of per-call listeners
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');

// Default menu image (working URL)
const DEFAULT_MENU_IMAGE = 'https://i.imgur.com/6Z2XZqM.jpeg';

const CATEGORY_MAP = {
    'download':     { section: 'download' },
    'downloader':   { section: 'download' },
    'media':        { section: 'download' },
    'audio':        { section: 'download' },
    'group':        { section: 'group' },
    'admin':        { section: 'group' },
    'security':     { section: 'group' },
    'search':       { section: 'search' },
    'fun':          { section: 'fun' },
    'anime':        { section: 'anime' },
    'tools':        { section: 'tools' },
    'convert':      { section: 'convert' },
    'converter':    { section: 'convert' },
    'owner':        { section: 'owner' },
    'settings':     { section: 'settings' },
    'ai':           { section: 'download' },
    'image':        { section: 'download' },
    'sticker':      { section: 'download' },
    'maker':        { section: 'fun' },
    'logo':         { section: 'download' },
    'utilities':    { section: 'tools' },
    'utility':      { section: 'tools' },
    'info':         { section: 'download' },
    'main':         { section: 'download' },
    'other':        { section: 'tools' },
    'menu':         { section: 'skip' },
};

const SECTION_ORDER = ['download', 'group', 'search', 'fun', 'anime', 'tools', 'convert', 'owner', 'settings'];

const SECTION_META = {
    download: { emoji: '💖', label: '𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃' },
    group:    { emoji: '💜', label: '𝐆𝐑𝐎𝐔𝐏' },
    search:   { emoji: '💙', label: '𝐒𝐄𝐀𝐑𝐂𝐇' },
    fun:      { emoji: '💚', label: '𝐅𝐔𝐍' },
    anime:    { emoji: '💛', label: '𝐀𝐍𝐈𝐌𝐄' },
    tools:    { emoji: '🧡', label: '𝐓𝐎𝐎𝐋𝐒' },
    convert:  { emoji: '🤍', label: '𝐂𝐎𝐍𝐕𝐄𝐑𝐓' },
    owner:    { emoji: '🖤', label: '𝐎𝐖𝐍𝐄𝐑' },
    settings: { emoji: '👑', label: '𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒' },
};

// Cache the command map
let _cachedSections = null;
let _cacheTime = 0;
const CACHE_TTL = 60000;

function buildCommandMap() {
    if (_cachedSections && Date.now() - _cacheTime < CACHE_TTL) return _cachedSections;

    const pluginsDir = path.join(__dirname);
    const sections = {};
    
    SECTION_ORDER.forEach(s => { sections[s] = []; });

    let files;
    try { files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js')); } catch (e) { return sections; }

    for (const file of files) {
        let src;
        try { src = fs.readFileSync(path.join(pluginsDir, file), 'utf-8'); } catch { continue; }
        const cmdBlockRegex = /cmd\s*\(\s*\{([\s\S]*?)\}\s*,/g;
        let blockMatch;
        while ((blockMatch = cmdBlockRegex.exec(src)) !== null) {
            const block = blockMatch[1];
            const patMatch = block.match(/pattern\s*:\s*['"`]([^'"`]+)['"`]/);
            if (!patMatch) continue;
            const pattern = patMatch[1].trim();
            const catMatch = block.match(/category\s*:\s*['"`]([^'"`]+)['"`]/);
            const rawCat = catMatch ? catMatch[1].trim().toLowerCase() : '';
            const mapped = CATEGORY_MAP[rawCat];
            
            if (mapped && mapped.section !== 'skip' && sections[mapped.section]) {
                if (!sections[mapped.section].includes(pattern)) {
                    sections[mapped.section].push(pattern);
                }
            }
        }
    }

    _cachedSections = sections;
    _cacheTime = Date.now();
    return sections;
}

function buildFullMenu(sections, botName, ownerName, prefix, mode, uptime, ramUsed, pushname) {
    const total = Object.values(sections).reduce((a, b) => a + b.length, 0);
    const ordered = SECTION_ORDER.filter(k => sections[k]?.length > 0);
    const numEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];

    let text = `ᥫ᭡🦋 𝐙𝐀𝐈𝐃𝐈 - 𝐌𝐃 ⏤͟͟͞͞🧸🎀\n\n`;
    text += `┏━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    text += `♡ User    ➩ ${pushname}\n`;
    text += `♡ Runtime ➩ ${uptime}\n`;
    text += `♡ Mode    ➩ ${mode.toUpperCase()}\n`;
    text += `♡ Status  ➩ Online ❤️‍🔥\n`;
    text += `┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    
    text += `╭────❰ 🌸 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 🌸 ❱────╮\n`;
    ordered.forEach((k, i) => {
        const meta = SECTION_META[k];
        text += `│ ${numEmojis[i]} ${meta.emoji} ➩ ${meta.label}\n`;
    });
    text += `╰───────────────────────╯\n\n`;
    
    // Show ALL commands section wise
    for (const section of ordered) {
        const meta = SECTION_META[section];
        text += `╭────❰ ${meta.emoji} ${meta.label} ❱────╮\n`;
        sections[section].forEach(cmd => {
            text += `│ • ${prefix}${cmd}\n`;
        });
        text += `╰───────────────────────╯\n\n`;
    }
    
    text += `╭────❰ ✨ 𝐒𝐘𝐒𝐓𝐄𝐌 ✨ ❱────╮\n`;
    text += `│ 💎 RAM     : ${ramUsed} MB\n`;
    text += `│ 🌟 Plugins : ${fs.readdirSync(__dirname).filter(f => f.endsWith('.js')).length}\n`;
    text += `│ 🎀 Version : ${config.VERSION || '1.0.0'}\n`;
    text += `╰───────────────────────╯\n\n`;
    
    text += `❣️─────────♡─────────❣️\n`;
    text += `    🌹 𝐅𝐀𝐒𝐓 • 𝐒𝐓𝐀𝐁𝐋𝐄 🌹\n`;
    text += `    👑 𝐒𝐄𝐂𝐔𝐑𝐄 • 𝐒𝐌𝐎𝐎𝐓𝐇 👑\n`;
    text += `❣️─────────♡─────────❣️\n\n`;
    
    text += `꧁💝❀ 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐙𝐀𝐈𝐃𝐈 ❀💝꧂\n\n`;
    text += `_Reply with a number to view section commands_`;
    
    return text;
}

function buildSubMenu(sectionKey, cmds, botName, prefix, pushname, uptime) {
    const meta = SECTION_META[sectionKey] || { emoji: '🔹', label: sectionKey.toUpperCase() };
    
    let text = `ᥫ᭡🦋 𝐙𝐀𝐈𝐃𝐈 - 𝐌𝐃 ⏤͟͟͞͞🧸🎀\n\n`;
    text += `┏━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    text += `♡ User    ➩ ${pushname}\n`;
    text += `♡ Section ➩ ${meta.emoji} ${meta.label}\n`;
    text += `♡ Total   ➩ ${cmds.length} commands\n`;
    text += `┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    
    text += `╭────❰ ${meta.emoji} ${meta.label} ❱────╮\n`;
    // Show ALL commands - no limit, no "+X more"
    cmds.forEach(c => { 
        text += `│ • ${prefix}${c}\n`; 
    });
    text += `╰───────────────────────╯\n\n`;
    
    text += `꧁💝❀ 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐙𝐀𝐈𝐃𝐈 ❀💝꧂`;
    
    return text;
}

// GLOBAL session map
const menuSessions = new Map();

function setupGlobalMenuHandler(conn) {
    conn.ev.on('messages.upsert', async (msgData) => {
        try {
            if (menuSessions.size === 0) return;

            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

            const stanzaId = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId;
            if (!stanzaId || !menuSessions.has(stanzaId)) return;

            const session = menuSessions.get(stanzaId);
            if (Date.now() > session.expiry) {
                menuSessions.delete(stanzaId);
                return;
            }

            const receivedText = (
                receivedMsg.message.conversation ||
                receivedMsg.message.extendedTextMessage?.text || ''
            ).trim();

            const numToSection = {};
            session.orderedSections.forEach((k, i) => { numToSection[String(i + 1)] = k; });
            const sectionKey = numToSection[receivedText];

            if (sectionKey && session.sections[sectionKey]) {
                const subText = buildSubMenu(sectionKey, session.sections[sectionKey], session.botName, session.prefix, session.pushname, session.uptime);
                const senderID = receivedMsg.key.remoteJid;
                try {
                    await conn.sendMessage(senderID, { text: subText }, { quoted: receivedMsg });
                } catch {
                    await conn.sendMessage(senderID, { text: subText }, { quoted: receivedMsg });
                }
                conn.sendMessage(senderID, { react: { text: '✅', key: receivedMsg.key } }).catch(() => {});
            }
        } catch (e) {}
    });
}

let globalHandlerSetup = false;

cmd({
    pattern: "menu",
    alias: ["amenu", "help"],
    desc: "Show bot command menu",
    category: "menu",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, reply, pushname }) => {
    try {
        if (!globalHandlerSetup) {
            setupGlobalMenuHandler(conn);
            globalHandlerSetup = true;
        }

        const uptime    = runtime(process.uptime());
        const ramUsed   = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const botName   = config.BOT_NAME   || 'ZAIDI-MD';
        const ownerName = config.OWNER_NAME || 'Owner';
        const prefix    = config.PREFIX     || '.';
        const mode      = config.MODE       || 'public';
        const pushName  = pushname || 'User';

        const sections = buildCommandMap();
        const orderedSections = SECTION_ORDER.filter(k => sections[k]?.length > 0);
        const menuText = buildFullMenu(sections, botName, ownerName, prefix, mode, uptime, ramUsed, pushName);

        // Get image from config, if not set use default
        const imageUrl = (config.MENU_IMAGE_URL && config.MENU_IMAGE_URL !== '') 
            ? config.MENU_IMAGE_URL 
            : DEFAULT_MENU_IMAGE;

        let sentMsg;
        try {
            sentMsg = await conn.sendMessage(from, {
                image: { url: imageUrl },
                caption: menuText,
            }, { quoted: mek });
        } catch (e) {
            // If image fails, send without image
            sentMsg = await conn.sendMessage(from, { text: menuText }, { quoted: mek });
        }

        menuSessions.set(sentMsg.key.id, {
            sections,
            orderedSections,
            botName,
            ownerName,
            prefix,
            pushname: pushName,
            uptime,
            from,
            expiry: Date.now() + 300000
        });

        setTimeout(() => menuSessions.delete(sentMsg.key.id), 300000);

    } catch (e) {
        console.error('[Menu Error]:', e);
        reply('Error loading menu. Please try again.');
    }
});

cmd({
    pattern: "setmenuimage",
    alias: ["imgmenu"],
    use: '.setmenuimage <url>',
    desc: "Set menu image URL (owner only)",
    category: "owner",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, reply }) => {
    if (!isOwner) return reply("Owner only command.");
    const url = args[0];
    if (!url) return reply("Usage: .setmenuimage <url>");
    if (!url.match(/^https?:\/\//)) return reply("Invalid URL format.");
    config.MENU_IMAGE_URL = url;
    reply(`✅ Menu image set successfully!\n📸 URL: ${url}`);
});
