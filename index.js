// ==================== MEMORY CLEANUP ====================
  global.gc = global.gc || (() => {});
  setInterval(() => {
      try { if (global.gc) global.gc(); } catch (e) {}
  }, 120000);

  // ==================== IMPORTS ====================
  const {
      default: makeWASocket,
      useMultiFileAuthState,
      DisconnectReason,
      jidNormalizedUser,
      getContentType,
      fetchLatestBaileysVersion,
      Browsers
  } = require('@whiskeysockets/baileys');

  const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
  const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data');
  const fs = require('fs');
  const P = require('pino');
  const config = require('./config');
  const GroupEvents = require('./lib/groupevents');
  const util = require('util');
  const { sms, downloadMediaMessage, AntiDelete } = require('./lib');
  const os = require('os');
  const path = require('path');

  // ==================== GLOBALS ====================
  let conn;
  const ownerNumber = [config.OWNER_NUMBER || '923315462969'];

  // Group metadata cache (2-minute TTL)
  const groupCache = new Map();
  const GROUP_CACHE_TTL = 120000;
  function getCachedGroup(jid) {
      const c = groupCache.get(jid);
      return (c && Date.now() - c.ts < GROUP_CACHE_TTL) ? c.data : null;
  }
  function setCachedGroup(jid, data) {
      groupCache.set(jid, { data, ts: Date.now() });
  }
  setInterval(() => {
      const now = Date.now();
      for (const [k, v] of groupCache.entries()) {
          if (now - v.ts > GROUP_CACHE_TTL) groupCache.delete(k);
      }
  }, 300000);

  // Temp dir cleanup
  const tempDir = path.join(os.tmpdir(), 'cache-temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  setInterval(() => {
      try {
          const now = Date.now();
          fs.readdirSync(tempDir).forEach(f => {
              try {
                  const fp = path.join(tempDir, f);
                  if (now - fs.statSync(fp).mtimeMs > 600000) fs.unlinkSync(fp);
              } catch (e) {}
          });
      } catch (e) {}
  }, 300000);

  // ==================== EXPRESS SETUP ====================
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 9090;
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Ensure sessions directory exists
  const SESSIONS_DIR = path.join(__dirname, 'sessions');
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

  // ==================== PAIRING STATE ====================
  let pairingSock = null;
  let pairingInProgress = false;
  let isBotConnected = false;
  let botStarted = false;

  // ==================== WEB PAIRING ROUTES ====================

  // Serve pair.html on both / and /pair
  app.get('/', (req, res) => {
      const pairFile = path.join(__dirname, 'pair.html');
      if (!isBotConnected && fs.existsSync(pairFile)) {
          return res.sendFile(pairFile);
      }
      res.json({ status: isBotConnected ? 'connected' : 'waiting', bot: config.BOT_NAME || 'ZAIDI-MD' });
  });

  app.get('/pair', (req, res) => {
      const pairFile = path.join(__dirname, 'pair.html');
      if (fs.existsSync(pairFile)) return res.sendFile(pairFile);
      res.status(404).json({ error: 'pair.html not found' });
  });

  // API: Generate pairing code
  app.get('/getpaircode', async (req, res) => {
      const number = (req.query.number || '').replace(/[^0-9]/g, '').trim();

      if (!number || number.length < 7 || number.length > 15) {
          return res.json({ error: 'Please enter a valid phone number with country code (e.g. 923001234567).' });
      }
      if (isBotConnected) {
          return res.json({ error: 'Bot is already connected to WhatsApp!' });
      }
      if (pairingInProgress) {
          return res.json({ error: 'Pairing is already in progress. Please wait a moment.' });
      }

      try {
          pairingInProgress = true;

          const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);
          const { version } = await fetchLatestBaileysVersion();

          pairingSock = makeWASocket({
              auth: state,
              printQRInTerminal: false,
              browser: Browsers.macOS('Firefox'),
              version,
              logger: P({ level: 'silent' }),
              retryRequestDelayMs: 250
          });

          pairingSock.ev.on('creds.update', saveCreds);

          // Allow socket to initialize
          await new Promise(r => setTimeout(r, 1500));

          const code = await pairingSock.requestPairingCode(number);
          const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

          console.log('Pairing code requested for:', number, '| Code:', formattedCode);

          pairingSock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
              if (connection === 'open') {
                  console.log('WhatsApp paired successfully via web pairing!');
                  isBotConnected = true;
                  pairingInProgress = false;
                  const oldSock = pairingSock;
                  pairingSock = null;
                  // Give credentials time to save, then start main bot
                  setTimeout(() => {
                      try { oldSock.end(undefined); } catch (e) {}
                      if (!botStarted) {
                          botStarted = true;
                          connectToWA();
                      }
                  }, 2000);
              } else if (connection === 'close') {
                  const reason = lastDisconnect?.error?.output?.statusCode;
                  if (reason === DisconnectReason.loggedOut) {
                      pairingInProgress = false;
                  }
              }
          });

          res.json({ code: formattedCode });

      } catch (err) {
          pairingInProgress = false;
          console.error('Pairing error:', err.message);
          res.json({ error: 'Failed to generate pairing code. Please try again. (' + (err.message || 'Unknown') + ')' });
      }
  });

  // Status check API
  app.get('/status', (req, res) => {
      res.json({
          connected: isBotConnected,
          pairing: pairingInProgress,
          bot: config.BOT_NAME || 'ZAIDI-MD'
      });
  });

  // Start Express server immediately so pairing page is available right away
  app.listen(port, () => {
      console.log('Server running on port ' + port);
      console.log('Pairing page: http://localhost:' + port + '/');
  });

  // ==================== SESSION INITIALIZATION ====================
  async function initSession() {
      const credsPath = path.join(SESSIONS_DIR, 'creds.json');

      // Already have saved session
      if (fs.existsSync(credsPath)) {
          console.log('Existing session found. Starting bot...');
          isBotConnected = true;
          botStarted = true;
          return connectToWA();
      }

      // Try SESSION_ID environment variable
      const SESSION_ID = config.SESSION_ID || '';
      if (SESSION_ID.trim()) {
          const sessdata = SESSION_ID.replace(/^ZAIDI-MD~/i, '').replace(/^[A-Z0-9_-]+-MD~/i, '').trim();
          try {
              const decodedData = Buffer.from(sessdata, 'base64').toString('utf-8');
              JSON.parse(decodedData); // validate JSON
              fs.writeFileSync(credsPath, decodedData);
              console.log('Session loaded from SESSION_ID. Starting bot...');
              isBotConnected = true;
              botStarted = true;
              return connectToWA();
          } catch (err) {
              console.error('Invalid SESSION_ID, falling back to web pairing:', err.message);
          }
      }

      // No session — web pairing is ready
      console.log('No session found.');
      console.log('Open the pairing page, enter your WhatsApp number, and use the code to link.');
  }

  // ==================== MAIN CONNECT FUNCTION ====================
  async function connectToWA() {
      console.log('Connecting to WhatsApp...');
      const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);
      const { version } = await fetchLatestBaileysVersion();

      conn = makeWASocket({
          logger: P({ level: 'silent' }),
          printQRInTerminal: false,
          browser: Browsers.macOS('Firefox'),
          syncFullHistory: false,
          auth: state,
          version,
          markOnlineOnConnect: config.ALWAYS_ONLINE === 'true',
          emitOwnEvents: false,
          fireInitQueries: false,
          retryRequestDelayMs: 250
      });

      // ==================== CONNECTION UPDATE ====================
      conn.ev.on('connection.update', (update) => {
          const { connection, lastDisconnect } = update;
          if (connection === 'close') {
              const statusCode = lastDisconnect?.error?.output?.statusCode;
              if (statusCode === DisconnectReason.loggedOut) {
                  console.log('Logged out. Delete sessions/creds.json and restart to re-pair.');
                  isBotConnected = false;
                  botStarted = false;
              } else {
                  console.log('Connection closed. Reconnecting...');
                  connectToWA();
              }
          } else if (connection === 'open') {
              isBotConnected = true;

              // Load plugins
              try {
                  const plugins = fs.readdirSync('./plugins/').filter(f => path.extname(f) === '.js');
                  let loaded = 0;
                  for (const plugin of plugins) {
                      try { require('./plugins/' + plugin); loaded++; } catch (err) {
                          console.error('Plugin error [' + plugin + ']:', err.message);
                      }
                  }
                  console.log('Plugins loaded: ' + loaded + '/' + plugins.length);
              } catch (err) {
                  console.error('Plugin loading error:', err);
              }
              console.log('Bot connected!');

              // Startup message
              const upMsg = '*' + (config.BOT_NAME || 'ZAIDI-MD') + ' is Online*\n\nPrefix: ' + config.PREFIX + ' | Mode: ' + config.MODE + '\nOwner: ' + config.OWNER_NAME + '\n\n> ' + (config.DESCRIPTION || 'Powered by ' + config.BOT_NAME);
              setTimeout(() => {
                  conn.sendMessage(conn.user.id, {
                      image: { url: config.ALIVE_VID || config.MENU_IMAGE_URL },
                      caption: upMsg
                  }).catch(() => {});
              }, 5000);

              // Always online heartbeat
              if (config.ALWAYS_ONLINE === 'true') {
                  setInterval(() => conn.sendPresenceUpdate('available').catch(() => {}), 30000);
              }
          }
      });

      conn.ev.on('creds.update', saveCreds);

      // ==================== ANTI DELETE ====================
      if (config.ANTI_DELETE === 'true') {
          conn.ev.on('messages.update', async updates => {
              try {
                  for (const update of updates) {
                      if (update.update?.message === null) await AntiDelete(conn, [update]);
                  }
              } catch (err) {}
          });
      }

      // ==================== ANTI CALL ====================
      conn.ev.on('call', async (json) => {
          try {
              if (config.ANTI_CALL !== 'true') return;
              const call = json.find(c => c.status === 'offer');
              if (call) await conn.rejectCall(call.id, call.from);
          } catch (err) {}
      });

      // ==================== GROUP EVENTS ====================
      conn.ev.on('group-participants.update', (update) => {
          try {
              GroupEvents(conn, update);
              groupCache.delete(update.id);
          } catch (err) {}
      });

      // ==================== MESSAGE HANDLER ====================
      conn.ev.on('messages.upsert', async (mekData) => {
          try {
              const message = mekData.messages[0];
              if (!message || !message.message) return;

              if (getContentType(message.message) === 'ephemeralMessage') {
                  message.message = message.message.ephemeralMessage.message;
              }

              if (config.READ_MESSAGE === 'true') {
                  conn.readMessages([message.key]).catch(() => {});
              }

              if (message.key?.remoteJid === 'status@broadcast') {
                  await handleStatusMessage(conn, message);
                  return;
              }

              const m = sms(conn, message);
              const type = getContentType(message.message);
              if (!type || type === 'protocolMessage' || type === 'senderKeyDistributionMessage') return;

              const from = message.key.remoteJid;
              if (!from) return;
              const isGroup = from.endsWith('@g.us');

              const body = (type === 'conversation') ? message.message.conversation
                  : (type === 'extendedTextMessage') ? message.message.extendedTextMessage.text
                  : (type === 'imageMessage') ? (message.message.imageMessage?.caption || '')
                  : (type === 'videoMessage') ? (message.message.videoMessage?.caption || '')
                  : '';

              const budy = typeof message.text === 'string' ? message.text : false;
              const currentPrefix = config.PREFIX;
              const isCmd = body.startsWith(currentPrefix);
              const command = isCmd ? body.slice(currentPrefix.length).trim().split(' ').shift().toLowerCase() : '';
              const args = body.trim().split(/ +/).slice(1);
              const q = args.join(' ');
              const text = q;

              const sender = message.key.fromMe
                  ? (conn.user.id.split(':')[0] + '@s.whatsapp.net')
                  : (message.key.participant || from);
              const senderNumber = sender.split('@')[0];
              const botNumber = conn.user.id.split(':')[0];
              const pushname = message.pushName || 'User';
              const isMe = botNumber.includes(senderNumber);
              const isOwner = ownerNumber.includes(senderNumber) || isMe;
              const botNumber2 = await jidNormalizedUser(conn.user.id);

              let groupMetadata = null, groupName = '', participants = [], groupAdmins = [], isBotAdmins = false, isAdmins = false;
              if (isGroup) {
                  groupMetadata = getCachedGroup(from);
                  if (!groupMetadata) {
                      groupMetadata = await conn.groupMetadata(from).catch(() => null);
                      if (groupMetadata) setCachedGroup(from, groupMetadata);
                  }
                  if (groupMetadata) {
                      groupName = groupMetadata.subject || '';
                      participants = groupMetadata.participants || [];
                      groupAdmins = getGroupAdmins(participants);
                      isBotAdmins = groupAdmins.includes(botNumber2);
                      isAdmins = groupAdmins.includes(sender);
                  }
              }

              const quoted = type === 'extendedTextMessage' && message.message.extendedTextMessage?.contextInfo != null
                  ? message.message.extendedTextMessage.contextInfo.quotedMessage || []
                  : [];

              const isReact = m.message?.reactionMessage ? true : false;
              const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: message });

              const faizan = [config.DEV || '', config.OWNER_NUMBER || ''];
              const isCreator = [botNumber, ...faizan]
                  .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
                  .includes(sender);

              if (isCreator && budy) {
                  if (budy.startsWith('%')) {
                      const code = budy.slice(2);
                      if (!code) return reply('Provide code to eval!');
                      try { reply(util.format(eval(code))); } catch (e) { reply(util.format(e)); }
                      return;
                  } else if (budy.startsWith('$')) {
                      const code = budy.slice(2);
                      if (!code) return reply('Provide code to run!');
                      try {
                          const result = await eval('(async()=>{\n' + code + '\n})()');
                          if (result !== undefined) reply(util.format(result));
                      } catch (e) { reply(util.format(e)); }
                      return;
                  }
              }

              if (!isReact && config.AUTO_REACT === 'true') {
                  const reactions = isOwner
                      ? ['👑', '💀', '⚙️', '🎯', '❤️']
                      : ['❤️', '🔥', '👍', '😊', '🌟'];
                  m.react(reactions[Math.floor(Math.random() * reactions.length)]).catch(() => {});
              }

              if (isCmd) {
                  if (config.AUTO_TYPING === 'true') conn.sendPresenceUpdate('composing', from).catch(() => {});
                  else if (config.AUTO_RECORDING === 'true') conn.sendPresenceUpdate('recording', from).catch(() => {});
              }

              if (!isOwner && config.MODE === 'private') return;
              if (!isOwner && isGroup && config.MODE === 'inbox') return;
              if (!isOwner && !isGroup && config.MODE === 'groups') return;

              if (isCmd && config.READ_CMD === 'true') {
                  conn.readMessages([message.key]).catch(() => {});
              }

              if (isCmd) {
                  const events = require('./command');
                  const cmd = events.commands.find(c => c.pattern === command) ||
                              events.commands.find(c => c.alias && c.alias.includes(command));
                  if (cmd) {
                      if (cmd.react) {
                          conn.sendMessage(from, { react: { text: cmd.react, key: message.key } }).catch(() => {});
                      }
                      try {
                          await cmd.function(conn, message, m, {
                              from, quoted, body, isCmd, command, args, q, text, isGroup,
                              sender, senderNumber, botNumber2, botNumber, pushname,
                              isMe, isOwner, isCreator, groupMetadata, groupName,
                              participants, groupAdmins, isBotAdmins, isAdmins, reply
                          });
                      } catch (e) {
                          console.error('[CMD Error]', command, ':', e.message);
                      }
                  }
              }

          } catch (err) {
              console.error('Message handler error:', err.message);
          }
      });

      // ==================== STATUS HANDLER ====================
      async function handleStatusMessage(conn, mek) {
          try {
              if (config.AUTO_STATUS_SEEN === 'true') conn.readMessages([mek.key]).catch(() => {});
              if (config.AUTO_STATUS_REACT === 'true') {
                  const emojis = ['❤️', '🔥', '💯', '😎', '✅', '🌟', '💫', '👀'];
                  await conn.sendMessage(mek.key.remoteJid, {
                      react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: mek.key }
                  }, { statusJidList: [mek.key.participant] });
              }
              if (config.AUTO_STATUS_REPLY === 'true' && mek.key.participant) {
                  conn.sendMessage(mek.key.participant, {
                      text: config.AUTO_STATUS_MSG || 'Seen your status 👀'
                  }).catch(() => {});
              }
          } catch (err) {}
      }
  }

  // ==================== BOOTSTRAP ====================
  initSession().catch(err => {
      console.error('Startup error:', err);
      process.exit(1);
  });
  