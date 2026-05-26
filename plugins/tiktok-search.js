const fetch = require("node-fetch");
const { cmd } = require("../command");

// STYLE
function style(text) {
    return `
*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰ 𓆩ZAIDI-MD𓆪 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
${text}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
`;
}

cmd({
  pattern: "tiktoksearch",
  alias: ["tiktoks", "tiks"],
  desc: "Search TikTok videos",
  react: '🔍',
  category: 'tools',
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {

  if (!args[0]) {
    return reply(style("❀ Usage: .tiktoksearch <query>"));
  }

  const query = args.join(" ");
  await store.react('⌛');

  try {
    const res = await fetch(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data?.data?.length) {
      return reply(style("❌ No results found"));
    }

    const results = data.data.slice(0, 5);

    for (const v of results) {

      let cap = `
❀ Title: ${v.title}
❀ Author: ${v.author}
❀ Duration: ${v.duration}
❀ URL: ${v.link}
`;

      await conn.sendMessage(from, {
        video: { url: v.nowm },
        caption: style(cap)
      }, { quoted: m });
    }

    await store.react('✅');

  } catch (err) {
    console.log(err);
    await store.react('❌');
    reply(style("❌ Error while searching"));
  }
});
