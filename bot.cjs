const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');

const { state, saveState } = useSingleFileAuthState(path.join(__dirname, 'auth_info.json'));

async function startBot() {
  const sock = makeWASocket({
    auth: state,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    if (qr) {
      console.log('📱 Scanne ce QR code avec WhatsApp pour connecter le bot :');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      console.log('Connexion fermée, tentative de reconnexion...');
      startBot();
    }
    if (connection === 'open') {
      console.log('Bot connecté avec succès !');
    }
  });

  sock.ev.on('creds.update', saveState);
}

startBot();
