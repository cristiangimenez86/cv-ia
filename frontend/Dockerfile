# Multi-stage Dockerfile for the Next.js CV frontend.
# Build context: repository root (so /content is available at build time for SSG/SSR).
#
# Build:  docker build -f frontend/Dockerfile -t cristiangimenez86/cv-web:latest .
# Run:    docker run -p 3000:80 cristiangimenez86/cv-web:latest

FROM node:20-alpine AS deps
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./
COPY content/ /content/

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone output + static assets
# Use standard Next.js runtime files to avoid standalone layout drift.
COPY --from=builder /app ./

# Content needed by SSR at runtime
COPY --from=builder /content /content

USER nextjs
EXPOSE 80

CMD ["node_modules/.bin/next", "start", "-p", "80", "-H", "0.0.0.0"]
