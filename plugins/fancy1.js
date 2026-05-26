const { cmd } = require('../command');

// ===== CUSTOM FONT ONLY =====
const customFont = {
a:"ʌ͆͜", b:"Ᏸ", c:"ɕ̄", d:"𝛛֟", e:"𝛆̽", f:"𝖋",
g:"̽̽ց", h:"ⱶ֟ɭ", i:"ı֟፝", j:"ʆ֟፝", k:"ʞ𝆭", l:"ɭ፝֟",
m:"ϻ֟͡", n:"η̽", o:"๏፝֟", p:"℘⃖", q:"͢𝚀",
r:"꧊ꝛ͢", s:"𝛅͓", t:"𝛕ͦ", u:"ʊ͛", v:"𝛎",
w:"Ꮿ", x:"ꭘ", y:"ɣ̬", z:"ʑ"
};

// ===== CONVERT FUNCTION =====
function convertCustom(text) {
let result = "";
for (let char of text.toLowerCase()) {
result += customFont[char] || char;
}
return result;
}

// ===== COMMAND =====
cmd({
pattern: "fancy1",
desc: "Simple Fancy Text",
category: "tools",
react: "✨",
filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {

if (!q) return reply("❌ Example: .fancy1 ZAIDI");

let result = convertCustom(q);

// ===== FINAL SIMPLE OUTPUT =====
let msg = `${result}

✍️ ZAIDI WRITES`;

conn.sendMessage(from, { text: msg }, { quoted: mek });

});
