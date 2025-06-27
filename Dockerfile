# Utilise node officiel (version 20 par exemple)
FROM node:20

# Installer git (nécessaire pour les dépendances git)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copier les fichiers package
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./

# Installer les dépendances (production seulement)
RUN npm install --production

# Copier le reste des fichiers
COPY . .

# Exposer le port si besoin
# EXPOSE 3000

# Commande pour lancer le bot
CMD ["node", "bot.cjs"]
