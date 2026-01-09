FROM node:18-alpine

WORKDIR /app

# Copy package.json from the context root (passed as render-setup/package.json)
# Or since we use dockerContext: . in render.yaml, we copy specifically:
COPY render-setup/package.json ./
RUN npm install --production

# Copy setup script
COPY render-setup/setup-database.js ./

# Set default command
CMD ["node", "setup-database.js"]
