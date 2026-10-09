# ==============================================================================
# STAGE 1: Builder
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt build tool biên dịch native module (bcrypt C++ addon)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==============================================================================
# STAGE 2: Production Runner
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Cài đặt curl phục vụ healthcheck
RUN apk add --no-cache curl

COPY package*.json ./
# Cài đặt dependencies production và compile native modules
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production && \
    apk del python3 make g++

# Sao chép artifacts đã build và cấu hình
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/login || exit 1

CMD ["node", "dist/main.js"]
