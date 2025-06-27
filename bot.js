import makeWASocket, {
  useSingleFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { Configuration, OpenAIApi } from "openai";

config();

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

const { state, saveState } = useSingleFileAuthState("./auth_info.json");

let iaActive = true;

const stickersDir = path.resolve("./stickers");
const stickers = fs.existsSync(stickersDir)
  ? fs.readdirSync(stickersDir).filter(f => f.endsWith(".webp"))
  : [];


const memoryDir = "./memory";
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

function loadMemory(jid) {
  const file = `${memoryDir}/${jid}.json`;
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
}

function saveMemory(jid, messages) {
  fs.writeFileSync(`${memoryDir}/${jid}.json`, JSON.stringify(messages.slice(-10), null, 2));
}

async function getBotResponse(prompt, jid) {
    const context = loadMemory(jid);
    context.push({ role: "user", content: prompt });

  const systemPrompt = \`Tu es un pote Discord toxique, sarcastique, qui insulte à moitié mais reste drôle. Sois insolent et familier.\`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    });
    
    const botReply = response.choices[0].message.content.trim();
    context.push({ role: "assistant", content: botReply });
    saveMemory(jid, context);
    return botReply;

  } catch (err) {
    console.error("OpenAI Error:", err);
    return "T'as cassé mon cerveau là. Réessaye plus tard.";
  }
}

async function startBot() {
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

      console.log("Déconnexion. Reconnexion ?", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot connecté à WhatsApp !");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const messageContent =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text;

    const isMentioned =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(
        sock.user.id
      ) || false;

    const isReplyToBot =
      msg.message?.extendedTextMessage?.contextInfo?.participant === sock.user.id;

    if (messageContent === "!ai on") {
      iaActive = true;
      return sock.sendMessage(from, { text: "Mode IA activé 🔥" }, { quoted: msg });
    }

    if (messageContent === "!ai off") {
      iaActive = false;
      return sock.sendMessage(from, { text: "Mode IA désactivé 📴" }, { quoted: msg });
    }

    if (iaActive && (isMentioned || isReplyToBot)) {
      const reply = await getBotResponse(messageContent, from);
      await sock.sendMessage(from, { text: reply }, { quoted: msg });

      if (Math.random() < 0.4 && stickers.length > 0) {
        const random = stickers[Math.floor(Math.random() * stickers.length)];
        const buffer = fs.readFileSync(path.join(stickersDir, random));
        await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
      }
    }
  });
}

startBot();
