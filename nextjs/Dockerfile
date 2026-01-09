# Multi-stage Dockerfile for Next.js app
# 1) deps: install node_modules
# 2) builder: build Next.js
# 3) runner: production runtime

FROM node:18-bullseye AS deps
WORKDIR /app
COPY nextjs/package*.json ./
# Prefer npm ci if lockfile exists; fallback to npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:18-bullseye AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs/. .
# Install iconv-lite to handle any encoding issues, then convert all files to UTF-8
RUN apt-get update && apt-get install -y iconv && \
    find . -name "*.js" -o -name "*.json" | while read file; do \
      iconv -f UTF-8 -t UTF-8 -c "$file" > "$file.tmp" && mv "$file.tmp" "$file" || true; \
    done && \
    apt-get remove -y iconv && apt-get clean
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
# Copy database schema and init script for RDS setup
COPY sql ./sql
COPY render-setup/render-rds-init.js ./render-rds-init.js
# Install pg client for database initialization
RUN npm install pg --no-save
EXPOSE 3000
# Initialize RDS database (idempotent) then start app
CMD ["sh", "-c", "node render-rds-init.js && npm start"]