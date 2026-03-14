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
COPY content/ ./content/

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY frontend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/content ./content
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json

USER nextjs
EXPOSE 80

CMD ["node", "./node_modules/next/dist/bin/next", "start", "-p", "80"]
