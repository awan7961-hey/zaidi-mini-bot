const { cmd } = require('../command');

  cmd({
      pattern: 'pair',
      alias: ['getpair', 'connect'],
      desc: 'Get WhatsApp pairing code to connect the bot',
      category: 'owner',
      react: '📱',
      filename: __filename
  }, async (conn, mek, m, { reply, isOwner, args, q }) => {
      if (!isOwner) return reply('❌ Only the owner can use this command.');

      if (!q) {
          return reply(`*📱 WhatsApp Pairing Code*\n\nUsage: .pair <number>\nExample: .pair 923001234567\n\nOr open the pairing page from your browser when the bot is deployed.`);
      }

      const number = q.replace(/[^0-9]/g, '').trim();
      if (!number || number.length < 7 || number.length > 15) {
          return reply('❌ Please provide a valid phone number with country code.\nExample: .pair 923001234567');
      }

      try {
          await reply('⏳ Requesting pairing code for ' + number + '...');

          // Use the local pairing API
          const port = process.env.PORT || 9090;
          const http = require('http');

          const code = await new Promise((resolve, reject) => {
              http.get('http://localhost:' + port + '/getpaircode?number=' + number, (res) => {
                  let data = '';
                  res.on('data', chunk => data += chunk);
                  res.on('end', () => {
                      try {
                          const json = JSON.parse(data);
                          if (json.error) reject(new Error(json.error));
                          else resolve(json.code);
                      } catch (e) { reject(e); }
                  });
              }).on('error', reject);
          });

          await reply(`*✅ Pairing Code Generated!*\n\n*Code:* ${code}\n\n*Steps to link:*\n1. Open WhatsApp on your phone\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Tap "Link with phone number instead"\n5. Enter the code above\n\n> Code is valid for 2 minutes.`);

      } catch (err) {
          reply('❌ Failed to get pairing code: ' + (err.message || 'Unknown error'));
      }
  });
  