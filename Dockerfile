# Utiliser une image Node.js officielle (version LTS)
FROM node:20-alpine

# Créer un dossier de travail
WORKDIR /app

# Copier package.json et package-lock.json (si présent)
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code source
COPY . .

# Exposer le port si nécessaire (pas obligatoire pour WhatsApp)
# EXPOSE 3000

# Commande pour démarrer ton bot
CMD ["node", "bot.js"]
