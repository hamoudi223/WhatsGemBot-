const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, MessageType } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const askGemini = require('./gemini')
const configPath = './config.json'

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    syncFullHistory: false,
    markOnlineOnConnect: false
  })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const messageType = Object.keys(msg.message)[0]
    const sender = msg.key.remoteJid
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const replyTo = msg.message?.extendedTextMessage?.contextInfo?.participant

    let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    if (!config.ai_enabled) return

    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
    const mentionedMe = mention.includes(botNumber)
    const repliedToMe = replyTo === botNumber

    if (mentionedMe || repliedToMe) {
      if (text.toLowerCase().startsWith('!ai off')) {
        config.ai_enabled = false
        fs.writeFileSync(configPath, JSON.stringify(config))
        return await sock.sendMessage(sender, { text: '🛑 Mode IA désactivé.' })
      } else if (text.toLowerCase().startsWith('!ai on')) {
        config.ai_enabled = true
        fs.writeFileSync(configPath, JSON.stringify(config))
        return await sock.sendMessage(sender, { text: '✅ Mode IA activé.' })
      }

      const reply = await askGemini(text)

      // 40% chance to send a sticker
      if (Math.random() < 0.4) {
        const stickersDir = path.join(__dirname, 'stickers')
        const stickerFiles = fs.readdirSync(stickersDir).filter(f => f.endsWith('.webp'))
        const chosenSticker = stickerFiles[Math.floor(Math.random() * stickerFiles.length)]
        const stickerBuffer = fs.readFileSync(path.join(stickersDir, chosenSticker))
        await sock.sendMessage(sender, { sticker: stickerBuffer }, { quoted: msg })
        await sock.sendMessage(sender, { text: reply }, { quoted: msg })
      } else {
        await sock.sendMessage(sender, { text: reply }, { quoted: msg })
      }
    }
  })
}

module.exports = startSock
