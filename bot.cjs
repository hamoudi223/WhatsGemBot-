const path = require('path');
const baileys = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const makeWASocket = baileys.default;
const { useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

const { state, saveState } = useSingleFileAuthState(path.join(__dirname, 'auth_info.json'));

async function startBot() {
  const { version } = await fetchLatestBaileysVersion();
  console.log(`Using Baileys version: ${version.join('.')}`);

  const sock = makeWASocket({
    auth: state,
    version,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Scan le QR code ci-dessus avec WhatsApp');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log('Connexion fermée, raison :', reason);

      if (reason === DisconnectReason.loggedOut) {
        console.log('Déconnecté, supprime auth_info.json pour te reconnecter');
        process.exit(0);
      } else {
        startBot(); // Reconnexion automatique
      }
    }

    if (connection === 'open') {
      console.log('Connexion réussie !');
    }
  });

  sock.ev.on('creds.update', saveState);
}

startBot();
