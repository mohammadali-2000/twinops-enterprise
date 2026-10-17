# ---------------------------------------------------------------------------
# TwinOps Enterprise - Docker build recipe
# Three stages, each one only keeps what the next stage actually needs,
# so the final image stays small instead of carrying build tools around.
# ---------------------------------------------------------------------------

# Stage 1: install dependencies only.
# Kept separate so Docker can reuse this layer and skip re-downloading
# packages when only source code changes, not package.json.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: build the application.
# Has the full source code and dependencies, runs "next build".
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# These are safe placeholder values only so the build step does not crash
# when it reads env vars. Real secrets are injected later, at container
# run time, never baked into the image itself.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: the actual production image that runs.
# Alpine + only the standalone output = a few hundred MB, not multiple GB.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as a non-root user inside the container (basic container security practice).
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
