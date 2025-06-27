const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { useSingleFileAuthState } = require('@whiskeysockets/baileys/lib/utils/auth-utils');
const qrcode = require('qrcode-terminal');
const path = require('path');

// Auth state
const { state, saveCreds } = useSingleFileAuthState(path.join(__dirname, 'auth_info.json'));

async function startBot() {
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '22.04.4'],
  });

  // Affichage du QR code
  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      console.log('🔵 Scan ce QR code pour connecter le bot :');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ Bot connecté à WhatsApp !');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode || 0;
      console.log(`❌ Déconnecté (code ${reason}) → tentative de reconnexion...`);
      startBot(); // Reconnexion automatique
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Exemple de réponse style pote toxique
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const jid = msg.key.remoteJid;

    if (text.toLowerCase().includes('salut')) {
      await sock.sendMessage(jid, { text: "Yo wsh t'as cru t'étais qui à dire salut toi 😒" });
    }

    if (text.toLowerCase().includes('ça va')) {
      await sock.sendMessage(jid, { text: "Non, j’suis un bot en dépression frère 💀" });
    }

    // Réponse si on le mentionne
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(sock.user.id)) {
      await sock.sendMessage(jid, { text: "T'as parlé d'moi ? T’as besoin de mon génie c’est ça ? 😎" });
    }
  });
}

startBot();
