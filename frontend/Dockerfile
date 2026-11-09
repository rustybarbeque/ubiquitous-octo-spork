# Next.js 16 (App Router). Production image uses the standalone output,
# enabled by `output: "standalone"` in next.config.ts.

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- dependencies ------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev: hot reload ---------------------------------------------------------
# Used by docker-compose.override.yml, which bind-mounts frontend/ over /app.
# Runs Turbopack (Next 16's default) for fast page loads. Turbopack relies on
# native file events, which don't cross a Windows -> Docker bind mount, so on
# Windows edits aren't picked up live: run `docker compose restart web` after
# changing files. (`next dev --webpack` would honor WATCHPACK_POLLING and
# reload live, at the cost of much slower page compiles.)
FROM base AS dev
ENV NODE_ENV=development \
    WATCHPACK_POLLING=true \
    CHOKIDAR_USEPOLLING=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]

# ---- build -------------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime -----------------------------------------------------------------
FROM base AS final
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
