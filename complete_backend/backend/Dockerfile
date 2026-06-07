# ── Safari Backend ──────────────────────────────────────
# Multi-runtime: Node.js 18 + Python 3
# Railway Root Directory: complete_backend/backend

FROM node:18-slim

# Install Python 3 via apt (guaranteed on PATH at /usr/bin/python3)
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy the rest of the application
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/app.js"]
