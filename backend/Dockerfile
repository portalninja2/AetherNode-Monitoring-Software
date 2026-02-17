FROM node:18-alpine

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

RUN npm install --production

# Copy app source
COPY . .

# Create data directory
RUN mkdir -p data

EXPOSE 3001

CMD ["node", "server.js"]
