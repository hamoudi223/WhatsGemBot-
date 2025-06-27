FROM node:20

WORKDIR /usr/src/app

COPY . .

RUN rm -rf node_modules package-lock.json && \
    npm install

CMD ["npm", "start"]
