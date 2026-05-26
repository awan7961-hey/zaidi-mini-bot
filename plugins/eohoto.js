const { cmd } = require('../command');
const mumaker = require('mumaker');

// ================== STYLE DESIGN ==================
function zaidiStyle(title, value, status) {
    return `
*╭━━━〔 𓆩ZAIDI-MD𓆪 〕━━━┈⊷*
*┃❖ 🎭 𝐓𝐢𝐭𝐥𝐞:* ${title}
*┃❖ 📝 𝐃𝐞𝐭𝐚𝐢𝐥𝐬:* ${value}
*┃❖ ⚙️ 𝐒𝐭𝐚𝐭𝐮𝐬:* ${status}
*┣━━━━━━━━━━━━━━━┈⊷*
*┃ 💎 𝐎𝐰𝐍𝐄𝐑:* *ZAIDI-TEXK*
*┃ 🤖 𝐁𝐎𝐓:* *𓆩ZAIDI-MD𓆪*
*╰━━━━━━━━━━━━━━━┈⊷*

> ⚡ Powered By ZAIDI-MD
`;
}

// ================== ALL STYLES ==================
const styles = {
    metallic: ["https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html","🔥"],
    ice: ["https://en.ephoto360.com/ice-text-effect-online-101.html","❄️"],
    snow: ["https://en.ephoto360.com/create-a-snow-3d-text-effect-free-online-621.html","☃️"],
    impressive: ["https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html","🎨"],
    matrix: ["https://en.ephoto360.com/matrix-text-effect-154.html","💻"],
    light: ["https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html","💡"],
    neon: ["https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html","🌈"],
    devil: ["https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html","😈"],
    purple: ["https://en.ephoto360.com/purple-text-effect-online-100.html","💜"],
    thunder: ["https://en.ephoto360.com/thunder-text-effect-online-97.html","⚡"],
    leaves: ["https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html","🍃"],
    "1917": ["https://en.ephoto360.com/1917-style-text-effect-523.html","📽️"],
    arena: ["https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html","🎮"],
    hacker: ["https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html","👨‍💻"],
    sand: ["https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html","🏖️"],
    blackpink: ["https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html","🎤"],
    glitch: ["https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html","📺"],
    fire: ["https://en.ephoto360.com/flame-lettering-effect-372.html","🔥"]
};

// ================== GENERATOR ==================
async function generateText(conn, from, mek, style, text, reply) {
    try {
        const [url, emoji] = styles[style];

        await conn.sendMessage(from, { react: { text: '⚡', key: mek.key } });

        if (!text) {
            return reply(zaidiStyle(style.toUpperCase(), `Example: .${style} ZAIDI`, '❌'));
        }

        await reply(zaidiStyle(style.toUpperCase(), `Generating: ${text}`, '⏳'));

        const res = await mumaker.ephoto(url, text);

        if (!res.image) throw "Image not generated";

        await conn.sendMessage(from, {
            image: { url: res.image },
            caption: zaidiStyle(style.toUpperCase(), `Text: ${text}`, '✅')
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: emoji, key: mek.key } });

    } catch (e) {
        console.log(e);
        reply(zaidiStyle(style.toUpperCase(), 'Error generating text', '❌'));
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
}

// ================== AUTO COMMANDS ==================
Object.keys(styles).forEach(style => {
    cmd({
        pattern: stylepic,
        desc: `Create ${style} text effect`,
        category: "fun",
        react: styles[style][1],
        filename: __filename
    },
    async (conn, mek, m, { from, q, reply }) => {
        await generateText(conn, from, mek, style, q, reply);
    });
});

// ================== MENU ==================
cmd({
    pattern: "textstyles",
    alias: ["txtstyles"],
    desc: "Show all text styles",
    category: "fun",
    react: "📜",
    filename: __filename
},
async (conn, mek, m, { reply }) => {

    let list = `*╭━━━〔 🎨 ZAIDI TEXT STUDIO 〕━━━┈⊷*\n\n`;

    Object.keys(styles).forEach(s => {
        list += `┃❖ ${styles[s][1]} .${s}\n`;
    });

    list += `
*┣━━━━━━━━━━━━━━━┈⊷*
*┃ 📌 Usage:* .style text
*┃ 📌 Example:* .neon ZAIDI
*╰━━━━━━━━━━━━━━━┈⊷*
`;

    reply(zaidiStyle("TEXT STYLES", list, "✅"));
});
