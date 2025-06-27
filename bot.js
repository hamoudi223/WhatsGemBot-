import { config } from "dotenv";
config();

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useSingleFileAuthState,
} from "@whiskeysockets/baileys";

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import OpenAI from "openai";

const { state, saveState } = useSingleFileAuthState("./memory/auth_info.json");

async function startBot() {
  const [version] = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (
        (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
      ) {
        startBot();
      } else {
        console.log("Déconnecté, supprime auth_info.json puis relance");
      }
    } else if (connection === "open") {
      console.log("Connexion réussie !");
    }
  });

  sock.ev.on("creds.update", saveState);

  // Exemple simple : répondre "Salut !" à tout message reçu
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    await sock.sendMessage(from, { text: "Salut !" });
  });
}

startBot().catch(console.error);
