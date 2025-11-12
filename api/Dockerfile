# Simple Node API container
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
