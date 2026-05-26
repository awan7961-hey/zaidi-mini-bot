const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

const { getConfig, setConfig } = require('./lib/configdb');

// Default values from environment variables
const ENV_DEFAULTS = {
    AUTO_STATUS_SEEN:     process.env.AUTO_STATUS_SEEN     || "false",
    AUTO_STATUS_REPLY:    process.env.AUTO_STATUS_REPLY    || "false",
    AUTO_STATUS_REACT:    process.env.AUTO_STATUS_REACT    || "false",
    AUTO_STATUS_MSG:      process.env.AUTO_STATUS_MSG      || "*𝚂𝙴𝙴𝙽 𝚈𝙾𝚄𝚁 𝚂𝚃𝙰𝚃𝚄𝚂*",
    ANTI_DELETE:          process.env.ANTI_DELETE          || "false",
    ANTI_DEL_PATH:        process.env.ANTI_DEL_PATH        || "inbox",
    WELCOME:              process.env.WELCOME              || "false",
    ADMIN_EVENTS:         process.env.ADMIN_EVENTS         || "false",
    ANTI_LINK:            process.env.ANTI_LINK            || "false",
    MENTION_REPLY:        process.env.MENTION_REPLY        || "false",
    MENU_IMAGE_URL:       process.env.MENU_IMAGE_URL       || "https://up6.cc/2026/05/177971006919991.png",
    PREFIX:               process.env.PREFIX               || ".",
    BOT_NAME:             process.env.BOT_NAME             || "ZAIDI-MD",
    STICKER_NAME:         process.env.STICKER_NAME         || "ZAIDI-MD",
    CUSTOM_REACT:         process.env.CUSTOM_REACT         || "false",
    CUSTOM_REACT_EMOJIS:  process.env.CUSTOM_REACT_EMOJIS  || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
    DELETE_LINKS:         process.env.DELETE_LINKS         || "false",
    OWNER_NUMBER:         process.env.OWNER_NUMBER         || "923315462969",
    OWNER_NAME:           process.env.OWNER_NAME           || "ZAIDI-MD",
    DESCRIPTION:          process.env.DESCRIPTION          || "*© Powered by ZAIDI-MD ❣️*",
    ALIVE_VID:            process.env.ALIVE_VID            || "https://files.catbox.moe/ba1k10.jpg",
    LIVE_MSG:             process.env.LIVE_MSG             || "ZINDA HUN YAR 🤖",
    READ_MESSAGE:         process.env.READ_MESSAGE         || "false",
    AUTO_REACT:           process.env.AUTO_REACT           || "false",
    ANTI_BAD:             process.env.ANTI_BAD             || "false",
    MODE:                 process.env.MODE                 || "public",
    ANTI_LINK_KICK:       process.env.ANTI_LINK_KICK       || "false",
    AUTO_STICKER:         process.env.AUTO_STICKER         || "false",
    AUTO_REPLY:           process.env.AUTO_REPLY           || "false",
    ALWAYS_ONLINE:        process.env.ALWAYS_ONLINE        || "false",
    PUBLIC_MODE:          process.env.PUBLIC_MODE          || "true",
    AUTO_TYPING:          process.env.AUTO_TYPING          || "false",
    READ_CMD:             process.env.READ_CMD             || "false",
    DEV:                  process.env.DEV                  || "923315462969",
    ANTI_VV:              process.env.ANTI_VV              || "false",
    AUTO_RECORDING:       process.env.AUTO_RECORDING       || "false",
    ANTI_CALL:            process.env.ANTI_CALL            || "false",
    ANTI_BOT:             process.env.ANTI_BOT             || "false",
};

// Proxy: reads configdb first (persistent), falls back to env defaults.
// Setting config.KEY = value saves to disk automatically.
const config = new Proxy(ENV_DEFAULTS, {
    get(target, key) {
        const dbVal = getConfig(key);
        if (dbVal !== null && dbVal !== undefined) return dbVal;
        return target[key];
    },
    set(target, key, value) {
        target[key] = value;
        setConfig(key, value);
        return true;
    }
});

module.exports = config;
    
