FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --production --no-audit --no-fund

COPY . .

RUN mkdir -p sessions

CMD ["node", "index.js"]
