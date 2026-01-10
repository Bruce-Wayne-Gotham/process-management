# Multi-stage Dockerfile for Next.js app
# 1) deps: install node_modules
# 2) builder: build Next.js
# 3) runner: production runtime

FROM node:18-bullseye AS deps
WORKDIR /app
COPY nextjs/package*.json ./
# Prefer npm ci if lockfile exists; fallback to npm install
# Switch to simple npm install to avoid lockfile issues across OS
RUN ls -la /app && cat /app/package.json
RUN npm install

FROM node:18-bullseye AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs/. .
# Fix line endings - convert CRLF to LF on all source files
RUN apt-get update && apt-get install -y dos2unix && \
    find . -type f \( -name "*.js" -o -name "*.json" -o -name "*.jsx" \) \
    -exec dos2unix {} \; && \
    apt-get remove -y dos2unix && apt-get clean && rm -rf /var/lib/apt/lists/*
# Build Next.js
RUN npm run build

FROM node:18-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Copy only what we need to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy database schema and setup scripts from parent context
COPY sql ./sql
COPY INITIALIZE_DATABASE.sql ./INITIALIZE_DATABASE.sql
COPY nextjs/start.sh ./start.sh

# Install pg client for the automated pre-deploy setup script
RUN npm install pg --no-save && chmod +x ./start.sh

EXPOSE 3000
# Start the app with initialization
CMD ["./start.sh"]