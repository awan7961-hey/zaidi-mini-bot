const { cmd } = require('../command');
const config = require('../config');
const { getConfig, setConfig, getAllConfig, resetConfig } = require('../lib/configdb');
const { exec } = require('child_process');

// ─────────────────────────────────────────────
// HELPER: restart bot after applying a setting
// ─────────────────────────────────────────────
function restartBot() {
    setTimeout(() => {
        exec("pm2 restart all || node index.js", () => {});
    }, 2000);
}

// ─────────────────────────────────────────────
// HELPER: on/off toggle
// ─────────────────────────────────────────────
function parseToggle(arg) {
    if (!arg) return null;
    const a = arg.toLowerCase().trim();
    if (['on', 'true', '1', 'yes', 'enable'].includes(a)) return 'true';
    if (['off', 'false', '0', 'no', 'disable'].includes(a)) return 'false';
    return null;
}

// ─────────────────────────────────────────────
// .settings — View all current settings
// ─────────────────────────────────────────────
cmd({
    pattern: "settings",
    alias: ["setting", "config", "botconfig"],
    desc: "View all bot settings",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can view settings!");

    const dbVals = getAllConfig();

    const settingsList = [
        ["BOT_NAME",           config.BOT_NAME],
        ["OWNER_NAME",         config.OWNER_NAME],
        ["OWNER_NUMBER",       config.OWNER_NUMBER],
        ["PREFIX",             config.PREFIX],
        ["MODE",               config.MODE],
        ["─────────────────", ""],
        ["AUTO_REACT",         config.AUTO_REACT],
        ["AUTO_TYPING",        config.AUTO_TYPING],
        ["AUTO_RECORDING",     config.AUTO_RECORDING],
        ["AUTO_STICKER",       config.AUTO_STICKER],
        ["AUTO_REPLY",         config.AUTO_REPLY],
        ["ALWAYS_ONLINE",      config.ALWAYS_ONLINE],
        ["READ_MESSAGE",       config.READ_MESSAGE],
        ["READ_CMD",           config.READ_CMD],
        ["─────────────────", ""],
        ["AUTO_STATUS_SEEN",   config.AUTO_STATUS_SEEN],
        ["AUTO_STATUS_REACT",  config.AUTO_STATUS_REACT],
        ["AUTO_STATUS_REPLY",  config.AUTO_STATUS_REPLY],
        ["─────────────────", ""],
        ["ANTI_DELETE",        config.ANTI_DELETE],
        ["ANTI_CALL",          config.ANTI_CALL],
        ["ANTI_LINK",          config.ANTI_LINK],
        ["ANTI_LINK_KICK",     config.ANTI_LINK_KICK],
        ["ANTI_BAD",           config.ANTI_BAD],
        ["ANTI_BOT",           config.ANTI_BOT],
        ["ANTI_VV",            config.ANTI_VV],
        ["─────────────────", ""],
        ["WELCOME",            config.WELCOME],
        ["ADMIN_EVENTS",       config.ADMIN_EVENTS],
        ["MENTION_REPLY",      config.MENTION_REPLY],
        ["CUSTOM_REACT",       config.CUSTOM_REACT],
        ["DELETE_LINKS",       config.DELETE_LINKS],
    ];

    let text = `⚙️ *${config.BOT_NAME} - Bot Settings*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;

    for (const [key, val] of settingsList) {
        if (key.startsWith("─")) {
            text += `${key}\n`;
            continue;
        }
        const fromDB = dbVals.hasOwnProperty(key);
        const display = val === 'true' ? '✅ ON' : val === 'false' ? '❌ OFF' : val;
        const tag = fromDB ? '' : '';
        text += `*${key}:* ${display}${tag}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📌 Use *.set <KEY> <value>* to change any setting\n`;
    text += `📌 Example: *.set AUTO_REACT on*`;

    reply(text);
});

// ─────────────────────────────────────────────
// .set <KEY> <value> — Universal setting command
// ─────────────────────────────────────────────
cmd({
    pattern: "set",
    alias: ["setconfig", "changesetting"],
    desc: "Change any bot setting. Usage: .set KEY value",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change settings!");
    if (args.length < 2) {
        return reply(
            `⚙️ *Usage:* .set KEY value\n\n` +
            `*Examples:*\n` +
            `.set AUTO_REACT on\n` +
            `.set MODE public\n` +
            `.set PREFIX .\n` +
            `.set BOT_NAME MyBot\n\n` +
            `Use *.settings* to see all keys.`
        );
    }

    const key = args[0].toUpperCase();
    const rawVal = args.slice(1).join(' ').trim();

    // Validate known keys
    const knownKeys = [
        'AUTO_STATUS_SEEN', 'AUTO_STATUS_REPLY', 'AUTO_STATUS_REACT', 'AUTO_STATUS_MSG',
        'ANTI_DELETE', 'ANTI_DEL_PATH', 'WELCOME', 'ADMIN_EVENTS', 'ANTI_LINK',
        'MENTION_REPLY', 'MENU_IMAGE_URL', 'PREFIX', 'BOT_NAME', 'STICKER_NAME',
        'CUSTOM_REACT', 'CUSTOM_REACT_EMOJIS', 'DELETE_LINKS', 'OWNER_NUMBER',
        'OWNER_NAME', 'DESCRIPTION', 'ALIVE_VID', 'LIVE_MSG', 'READ_MESSAGE',
        'AUTO_REACT', 'ANTI_BAD', 'MODE', 'ANTI_LINK_KICK', 'AUTO_STICKER',
        'AUTO_REPLY', 'ALWAYS_ONLINE', 'AUTO_TYPING', 'READ_CMD', 'ANTI_VV',
        'AUTO_RECORDING', 'ANTI_CALL', 'ANTI_BOT'
    ];

    if (!knownKeys.includes(key)) {
        return reply(`❌ Unknown key: *${key}*\n\nUse *.settings* to see all valid keys.`);
    }

    // Boolean fields — normalize
    const boolKeys = [
        'AUTO_STATUS_SEEN', 'AUTO_STATUS_REPLY', 'AUTO_STATUS_REACT', 'ANTI_DELETE',
        'WELCOME', 'ADMIN_EVENTS', 'ANTI_LINK', 'MENTION_REPLY', 'CUSTOM_REACT',
        'DELETE_LINKS', 'READ_MESSAGE', 'AUTO_REACT', 'ANTI_BAD', 'ANTI_LINK_KICK',
        'AUTO_STICKER', 'AUTO_REPLY', 'ALWAYS_ONLINE', 'AUTO_TYPING', 'READ_CMD',
        'ANTI_VV', 'AUTO_RECORDING', 'ANTI_CALL', 'ANTI_BOT'
    ];

    let finalVal = rawVal;
    if (boolKeys.includes(key)) {
        const t = parseToggle(rawVal);
        if (!t) return reply(`❌ For *${key}* use *on* or *off*.`);
        finalVal = t;
    }

    // MODE special check
    if (key === 'MODE') {
        const validModes = ['public', 'private', 'inbox', 'groups'];
        if (!validModes.includes(rawVal.toLowerCase())) {
            return reply(`❌ Valid modes: *public*, *private*, *inbox*, *groups*`);
        }
        finalVal = rawVal.toLowerCase();
    }

    config[key] = finalVal;

    const display = finalVal === 'true' ? '✅ ON' : finalVal === 'false' ? '❌ OFF' : `*${finalVal}*`;
    reply(`✅ *${key}* set to ${display}\n\n_Setting saved permanently._`);
});

// ─────────────────────────────────────────────
// .resetconfig <KEY> — Reset a key to env default
// ─────────────────────────────────────────────
cmd({
    pattern: "resetconfig",
    alias: ["resetset", "resetkey"],
    desc: "Reset a setting to its default (env) value",
    category: "owner",
    react: "♻️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can reset settings!");
    if (!args[0]) return reply("❌ Usage: .resetconfig KEY\nExample: .resetconfig AUTO_REACT");

    const key = args[0].toUpperCase();
    resetConfig(key);
    reply(`♻️ *${key}* has been reset to its default value.`);
});

// ─────────────────────────────────────────────
// .resetallconfig — Wipe all saved config, back to env defaults
// ─────────────────────────────────────────────
cmd({
    pattern: "resetallconfig",
    desc: "Wipe all saved settings and revert to defaults",
    category: "owner",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can use this!");
    if (args[0] !== 'confirm') {
        return reply(`⚠️ This will *delete ALL saved settings* and revert to env defaults.\n\nType *.resetallconfig confirm* to proceed.`);
    }

    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '../config.db.json');
    try {
        if (fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
        reply(`✅ All settings reset to defaults.`);
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ─────────────────────────────────────────────
// Individual toggle commands — quick shortcuts
// ─────────────────────────────────────────────

const TOGGLES = [
    { pattern: "autoreact",       alias: ["auto-react"],        key: "AUTO_REACT",        label: "Auto React" },
    { pattern: "autotyping",      alias: ["auto-typing","typing"], key: "AUTO_TYPING",     label: "Auto Typing" },
    { pattern: "autorecording",   alias: ["auto-recording","recoding"], key: "AUTO_RECORDING", label: "Auto Recording" },
    { pattern: "autosticker",     alias: ["auto-sticker"],       key: "AUTO_STICKER",      label: "Auto Sticker" },
    { pattern: "autoreply",       alias: ["auto-reply"],         key: "AUTO_REPLY",        label: "Auto Reply" },
    { pattern: "alwaysonline",    alias: ["online","always-online"], key: "ALWAYS_ONLINE", label: "Always Online" },
    { pattern: "readmessage",     alias: ["read-message","autoread"], key: "READ_MESSAGE", label: "Read Message" },
    { pattern: "readcmd",         alias: ["read-cmd"],           key: "READ_CMD",          label: "Read CMD" },
    { pattern: "autostatusseen",  alias: ["statusview","sview"], key: "AUTO_STATUS_SEEN",  label: "Auto Status View" },
    { pattern: "autostatusreact", alias: ["sreact","statusreact"], key: "AUTO_STATUS_REACT", label: "Auto Status React" },
    { pattern: "autostatusreply", alias: ["statusreply","status-reply"], key: "AUTO_STATUS_REPLY", label: "Auto Status Reply" },
    { pattern: "antidelete",      alias: ["anti-delete"],        key: "ANTI_DELETE",       label: "Anti Delete" },
    { pattern: "anticall",        alias: ["anti-call"],          key: "ANTI_CALL",         label: "Anti Call" },
    { pattern: "antilink",        alias: ["anti-link"],          key: "ANTI_LINK",         label: "Anti Link" },
    { pattern: "antilinkick",     alias: ["anti-link-kick"],     key: "ANTI_LINK_KICK",    label: "Anti Link Kick" },
    { pattern: "antibad",         alias: ["anti-bad","antibadword"], key: "ANTI_BAD",      label: "Anti Bad Word" },
    { pattern: "antibot",         alias: ["anti-bot"],           key: "ANTI_BOT",          label: "Anti Bot" },
    { pattern: "antivv",          alias: ["anti-vv","anti-once"], key: "ANTI_VV",          label: "Anti View Once" },
    { pattern: "welcome",         alias: ["setwelcome"],         key: "WELCOME",           label: "Welcome Message" },
    { pattern: "adminevents",     alias: ["admin-events"],       key: "ADMIN_EVENTS",      label: "Admin Events" },
    { pattern: "mentionreply",    alias: ["mention-reply"],      key: "MENTION_REPLY",     label: "Mention Reply" },
    { pattern: "customreact",     alias: ["custom-react"],       key: "CUSTOM_REACT",      label: "Custom React" },
    { pattern: "deletelinks",     alias: ["delete-links"],       key: "DELETE_LINKS",      label: "Delete Links" },
];

for (const t of TOGGLES) {
    cmd({
        pattern: t.pattern,
        alias: t.alias,
        desc: `Enable or disable ${t.label}`,
        category: "settings",
        react: "⚙️",
        filename: __filename
    }, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
        if (!isOwner && !isCreator) return reply(`❌ Only the owner can change *${t.label}*!`);

        if (!args[0]) {
            const cur = config[t.key];
            const curDisplay = cur === 'true' ? '✅ ON' : '❌ OFF';
            return reply(
                `⚙️ *${t.label}*\n` +
                `Current: ${curDisplay}\n\n` +
                `Usage: *.${t.pattern} on/off*`
            );
        }

        const val = parseToggle(args[0]);
        if (!val) return reply(`❌ Use *on* or *off*.\nExample: *.${t.pattern} on*`);

        config[t.key] = val;
        const display = val === 'true' ? '✅ Enabled' : '❌ Disabled';
        reply(`${display} — *${t.label}*`);
    });
}

// ─────────────────────────────────────────────
// .mode — Set bot mode
// ─────────────────────────────────────────────
cmd({
    pattern: "mode",
    alias: ["setmode", "botmode"],
    desc: "Set bot mode: public / private / inbox / groups",
    category: "settings",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change the mode!");

    const currentMode = config.MODE || "public";

    if (!args[0]) {
        return reply(
            `⚙️ *Bot Mode*\n` +
            `Current: *${currentMode.toUpperCase()}*\n\n` +
            `Available modes:\n` +
            `• *public* — responds to everyone\n` +
            `• *private* — responds only to owner\n` +
            `• *inbox* — owner only in DM, everyone in groups\n` +
            `• *groups* — groups only, not DMs\n\n` +
            `Usage: *.mode public*`
        );
    }

    const modeArg = args[0].toLowerCase();
    if (!['public', 'private', 'inbox', 'groups'].includes(modeArg)) {
        return reply(`❌ Invalid mode.\nUse: *public*, *private*, *inbox*, or *groups*`);
    }

    config.MODE = modeArg;
    reply(`✅ Bot mode set to *${modeArg.toUpperCase()}*`);
});

// ─────────────────────────────────────────────
// .setprefix — Change command prefix
// ─────────────────────────────────────────────
cmd({
    pattern: "setprefix",
    alias: ["prefix", "changeprefix"],
    desc: "Change the bot command prefix",
    category: "settings",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change the prefix!");
    const newPrefix = args[0]?.trim();
    if (!newPrefix || newPrefix.length > 3) return reply("❌ Provide a valid prefix (1-3 characters).\nExample: *.setprefix !*");
    config.PREFIX = newPrefix;
    reply(`✅ Prefix changed to: *${newPrefix}*\n_Use ${newPrefix}command from now on._`);
});

// ─────────────────────────────────────────────
// .setbotname — Change bot name
// ─────────────────────────────────────────────
cmd({
    pattern: "setbotname",
    alias: ["botname"],
    desc: "Change the bot's name",
    category: "settings",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change the bot name!");
    const name = args.join(' ').trim();
    if (!name) return reply("❌ Provide a name.\nExample: *.setbotname ZAIDI-MD*");
    config.BOT_NAME = name;
    reply(`✅ Bot name set to: *${name}*`);
});

// ─────────────────────────────────────────────
// .setownername — Change owner name
// ─────────────────────────────────────────────
cmd({
    pattern: "setownername",
    alias: ["ownername"],
    desc: "Change the owner's display name",
    category: "settings",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change this!");
    const name = args.join(' ').trim();
    if (!name) return reply("❌ Provide a name.\nExample: *.setownername Ahmed*");
    config.OWNER_NAME = name;
    reply(`✅ Owner name set to: *${name}*`);
});

// ─────────────────────────────────────────────
// .setstatmsg — Set the auto-status reply message
// ─────────────────────────────────────────────
cmd({
    pattern: "setstatmsg",
    alias: ["statusmsg", "setstatusmsg"],
    desc: "Set the auto status reply message",
    category: "settings",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change this!");
    const msg = args.join(' ').trim();
    if (!msg) return reply("❌ Provide a message.\nExample: *.setstatmsg Seen your status 👀*");
    config.AUTO_STATUS_MSG = msg;
    reply(`✅ Auto status message set to:\n${msg}`);
});

// ─────────────────────────────────────────────
// .setbotimage — Set bot menu/alive image URL
// ─────────────────────────────────────────────
cmd({
    pattern: "setbotimage",
    alias: ["botdp", "botpic", "botimage"],
    desc: "Set the bot image URL (or reply to an image)",
    category: "settings",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change the bot image!");

    const axios = require('axios');
    const FormData = require('form-data');
    const os = require('os');
    const path = require('path');
    const fs = require('fs');

    let imageUrl = args[0];

    if (!imageUrl && m.quoted) {
        const quotedMsg = m.quoted;
        const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
        if (!mimeType.startsWith("image")) return reply("❌ Please reply to an image.");
        try {
            const mediaBuffer = await quotedMsg.download();
            const extension = mimeType.includes("jpeg") ? ".jpg" : ".png";
            const tempFilePath = path.join(os.tmpdir(), `botimg_${Date.now()}${extension}`);
            fs.writeFileSync(tempFilePath, mediaBuffer);
            const form = new FormData();
            form.append("fileToUpload", fs.createReadStream(tempFilePath), `botimage${extension}`);
            form.append("reqtype", "fileupload");
            const response = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders() });
            fs.unlinkSync(tempFilePath);
            if (typeof response.data !== 'string' || !response.data.startsWith('https://')) {
                throw new Error(`Upload failed: ${response.data}`);
            }
            imageUrl = response.data;
        } catch (err) {
            return reply(`❌ Upload error: ${err.message}`);
        }
    }

    if (!imageUrl || !imageUrl.startsWith("http")) {
        return reply("❌ Provide a valid image URL or reply to an image.\nExample: *.setbotimage https://example.com/img.jpg*");
    }

    config.MENU_IMAGE_URL = imageUrl;
    config.ALIVE_VID = imageUrl;
    reply(`✅ Bot image updated!\n*URL:* ${imageUrl}`);
});

// ─────────────────────────────────────────────
// .setstickerpack — Set sticker pack name
// ─────────────────────────────────────────────
cmd({
    pattern: "setstickerpack",
    alias: ["stickerpack", "stickerinfo"],
    desc: "Set the sticker pack name",
    category: "settings",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change this!");
    const name = args.join(' ').trim();
    if (!name) return reply("❌ Provide a sticker pack name.\nExample: *.setstickerpack MyPack*");
    config.STICKER_NAME = name;
    reply(`✅ Sticker pack name set to: *${name}*`);
});

// ─────────────────────────────────────────────
// .setreactemojis — Set custom react emojis
// ─────────────────────────────────────────────
cmd({
    pattern: "setreactemojis",
    alias: ["reactemojis", "setemojis"],
    desc: "Set custom reaction emojis (comma-separated)",
    category: "settings",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change this!");
    const emojis = args.join(' ').trim();
    if (!emojis) return reply("❌ Provide emojis separated by commas.\nExample: *.setreactemojis ❤️,🔥,💯,👍*");
    config.CUSTOM_REACT_EMOJIS = emojis;
    reply(`✅ Custom react emojis set to: ${emojis}`);
});

// ─────────────────────────────────────────────
// .setantidelpath — Set anti-delete destination
// ─────────────────────────────────────────────
cmd({
    pattern: "setantidelpath",
    alias: ["antidelpath", "adpath"],
    desc: "Set anti-delete path: inbox or same",
    category: "settings",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { args, isOwner, isCreator, reply }) => {
    if (!isOwner && !isCreator) return reply("❌ Only the owner can change this!");
    const val = args[0]?.toLowerCase().trim();
    if (!val || !['inbox', 'same'].includes(val)) {
        return reply(
            `⚙️ *Anti-Delete Path*\n` +
            `Current: *${config.ANTI_DEL_PATH}*\n\n` +
            `• *inbox* — resend deleted msgs to your DM\n` +
            `• *same* — resend in the same chat\n\n` +
            `Usage: *.setantidelpath inbox*`
        );
    }
    config.ANTI_DEL_PATH = val;
    reply(`✅ Anti-delete path set to: *${val}*`);
});
