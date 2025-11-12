FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy setup scripts
COPY setup-database.js ./
COPY verify-database.js ./

# Create entrypoint script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Set environment variables (will be overridden by docker-compose)
ENV SUPABASE_URL=""
ENV SUPABASE_KEY=""

# Run the setup
ENTRYPOINT ["./entrypoint.sh"]
