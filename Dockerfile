# syntax=docker/dockerfile:1
# cmtecnologia.pt — self-hosted static site + former Vercel functions (Express).
# Build happens in CI / locally, NEVER on the production VPS (RAM). See docs/DEPLOY.md.
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Production deps first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Non-root runtime user.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nodeapp

# App: server + functions + static site (incl. scenes/ videos). .dockerignore
# keeps secrets, node_modules and VCS out of the build context.
COPY --chown=nodeapp:nodejs . .

USER nodeapp
EXPOSE 3000
CMD ["node", "server.js"]
