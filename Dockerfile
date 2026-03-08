# ── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build TypeScript ────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src/ ./src/
RUN pnpm build

# ── Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Non-root user — never run as root in production
RUN addgroup -g 1001 -S bodhi && adduser -u 1001 -S bodhi -G bodhi

# Production deps only
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Compiled output from builder
COPY --from=builder /app/dist ./dist

# Vault directory — will be mounted as a named volume
RUN mkdir -p /app/vault && chown -R bodhi:bodhi /app

USER bodhi

# Health signal: if process exits, Docker restarts it
CMD ["node", "dist/index.js"]
