require('dotenv').config();
const { default: makeWASocket, DisconnectReason, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');

const { state, saveState } = useSingleFileAuthState(path.join(__dirname, 'auth_info.json'));

async function startBot() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA version v${version.join('.')}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('QR Code generated, scan it with WhatsApp.');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('Connected to WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!text) return;

    console.log(`Message from ${from}: ${text}`);

    if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(from, { text: 'Pong!' });
    }
  });
}

startBot().catch(err => console.error(err));
