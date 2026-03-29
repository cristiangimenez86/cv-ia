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
# Resolves with frontend/src/lib/cvSectionIds.ts → ../../../shared/section-ids.json (= /shared/… in this image)
COPY shared/ /shared/

RUN npm run build

# Next emits the app folder as `frontend` (local monorepo) or `app` (Docker COPY to /app).
RUN for d in /app/.next/standalone/*/; do \
      if [ -f "${d}server.js" ]; then mv "$d" /app/.next/standalone/_run; break; fi; \
    done && test -f /app/.next/standalone/_run/server.js

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone trace only (not full node_modules — avoids multi‑GB images).
# Builder renames the traced app dir to _run (see above).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/_run ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Content needed by SSR at runtime (see getContentDir in loader)
COPY --from=builder --chown=nextjs:nodejs /content /content

USER nextjs
EXPOSE 80

CMD ["node", "server.js"]
