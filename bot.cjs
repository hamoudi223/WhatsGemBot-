const { default: makeWASocket, DisconnectReason, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

const { state, saveCreds } = useSingleFileAuthState(path.join(__dirname, 'auth_info.json'));

async function startBot() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // désactivé, on gère manuellement
    browser: ['Ubuntu', 'Chrome', '22.04.4'],
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('📱 Scan le QR code ci-dessus pour connecter ton bot');
    }

    if (connection === 'close') {
      const reason = update.lastDisconnect?.error?.output?.statusCode;
      console.log('❌ Déconnecté, raison:', reason);
    } else if (connection === 'open') {
      console.log('✅ Connecté à WhatsApp !');
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

startBot();
