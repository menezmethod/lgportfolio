# Stage 1: Install dependencies (linux/amd64 for Cloud Run; Next.js 16 requires Node 20.9+)
FROM --platform=linux/amd64 node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Stage 2: Build the application
FROM --platform=linux/amd64 node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# GA4: inlined at build time (optional; set via --build-arg in Cloud Build)
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID}
RUN npm run build

# Stage 3: Production runner (minimal attack surface)
FROM --platform=linux/amd64 node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk --no-cache add dumb-init \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Production (Cloud Run): PORT=8080 is set by Terraform/Cloud Build.
# Local docker run: PORT is unset so Next.js defaults to 3000; use -p 3000:3000.
ENV HOSTNAME="0.0.0.0"
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://localhost:${PORT:-8080}/" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
