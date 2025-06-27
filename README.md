# 🤖 Bot WhatsApp IA Toxique

Ce bot utilise **WhatsApp Web** via [Baileys (WhiskeySockets)](https://github.com/WhiskeySockets/Baileys) et **GPT-4** pour répondre comme un **pote Discord toxique**.

## 🧠 Fonctionnalités

- Réponses automatiques quand on tag le bot ou répond à son message.
- Style **humain + toxique + marrant**
- 40% de chance qu’il envoie un **sticker .webp** aléatoire
- Commandes :
  - `!ai on` pour activer
  - `!ai off` pour désactiver

## 🚀 Lancer le bot

```bash
npm install
node bot.js
```

## 📁 Structure

```
.
├── bot.js
├── .env
├── package.json
├── stickers/
│   └── [tes fichiers .webp]
└── auth_info.json (généré après connexion)
```

**Ajoute ta clé Gemini/OpenAI dans `.env` :**

```
OPENAI_API_KEY=sk-xxxxxx
```

---

> Made by TOI. Avec du sel, du style, et un peu de venin 🐍.
