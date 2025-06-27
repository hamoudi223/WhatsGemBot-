require('dotenv').config();

const baileys = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const {
  makeWASocket,
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = baileys;

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startBot() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA version v${version.join('.')}, latest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Scan le QR code ci-dessus');
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection fermée, reconnect?', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      } else {
        console.log('Déconnecté (logged out).');
      }
    } else if (connection === 'open') {
      console.log('Connecté à WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveState);

  // Exemple d'écoute message simple
  sock.ev.on('messages.upsert', ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    console.log(`Message reçu de ${from}: ${text}`);

    if (text.toLowerCase() === '!ping') {
      sock.sendMessage(from, { text: 'Pong!' });
    }
  });
}

startBot().catch(console.error);
