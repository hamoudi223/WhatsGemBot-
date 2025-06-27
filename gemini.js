const axios = require('axios')
require('dotenv').config()

async function askGemini(message) {
  const prompt = `Réponds comme un pote Discord toxique. Sois marrant, sec, mais jamais robotique. Voici le message : "${message}"`
  const res = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
    { contents: [{ parts: [{ text: prompt }] }] }
  )
  return res.data.candidates[0].content.parts[0].text
}

module.exports = askGemini
