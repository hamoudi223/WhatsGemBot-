const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const path = require('path');
const qrcode = require('qrcode-terminal');

const { state, saveState } = useSingleFileAuthState(path.join(__dirname, 'auth_info.json'));

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false // deprecated, on gère QR nous-mêmes
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Scanne ce QR avec ton WhatsApp');
    }
    if (connection === 'close') {
      const reason = update.lastDisconnect?.error?.output?.statusCode;
      console.log('Déconnexion, raison:', reason);
      if (reason === DisconnectReason.loggedOut) {
        console.log('Session déconnectée, supprime auth_info.json pour réauthentifier');
      } else {
        startBot(); // restart le bot si déconnexion non prévue
      }
    }
    if (connection === 'open') {
      console.log('Connecté à WhatsApp !');
    }
  });

  sock.ev.on('creds.update', saveState);
}

startBot();
