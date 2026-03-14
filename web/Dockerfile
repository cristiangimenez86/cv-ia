# Multi-stage Dockerfile for the Next.js CV frontend.
# Build context: repository root (so /content is available at build time for SSG).
#
# Build:  docker build -f apps/web/Dockerfile -t cristiangimenez86/cv-web .
# Run:    docker run -p 3000:3000 cristiangimenez86/cv-web

# ── Stage 1: install dependencies ─────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY apps/web/package.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# ── Stage 2: build ────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ ./

# Content is two levels up at runtime; for Docker build, copy into the
# location the loader expects: ../../content → /content
COPY content/ /content/

RUN yarn build

# ── Stage 3: production runner ────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone output + static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Content needed at request time (SSR / revalidation)
COPY --from=builder /content /content

USER nextjs
EXPOSE 80

CMD ["node", "server.js"]
