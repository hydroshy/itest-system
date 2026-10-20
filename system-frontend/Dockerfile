# ==============================================================================
# STAGE 1: Build Vue 3 Frontend
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy SDK dependency first
COPY packages/frontend-sdk /app/packages/frontend-sdk
WORKDIR /app/packages/frontend-sdk
RUN pnpm install && pnpm run build

# Build Frontend
WORKDIR /app/system-frontend
COPY system-frontend/package.json system-frontend/pnpm-lock.yaml ./
RUN pnpm install --ignore-scripts

COPY system-frontend/ .
RUN pnpm run build

# ==============================================================================
# STAGE 2: Production Nginx Server
# ==============================================================================
FROM nginx:alpine AS runner

COPY --from=builder /app/system-frontend/dist /usr/share/nginx/html
COPY system-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
