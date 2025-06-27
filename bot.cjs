const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');

// Auth
const { state, saveState } = useSingleFileAuthState(path.join(__dirname, 'auth_info.json'));

// Create socket
const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
  browser: ['ThatBotz', 'Chrome', '1.0.0']
});

sock.ev.on('creds.update', saveState);

sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === 'close') {
    const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
    console.log('Connection closed. Reconnecting:', shouldReconnect);
    if (shouldReconnect) {
      require('./bot.cjs'); // redémarre le bot
    }
  } else if (connection === 'open') {
    console.log('✅ Bot connecté avec succès !');
  }
});
