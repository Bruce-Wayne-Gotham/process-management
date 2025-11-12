FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --production

# Copy setup script
COPY setup-database.js ./

# Set default command
CMD ["node", "setup-database.js"]
