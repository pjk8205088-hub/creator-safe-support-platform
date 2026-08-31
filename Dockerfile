FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml

RUN corepack enable \
  && corepack prepare pnpm@9.15.9 --activate \
  && pnpm install --no-frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm --filter @cssp/shared build \
  && pnpm --filter @cssp/web build \
  && pnpm --filter @cssp/api prisma:generate \
  && pnpm --filter @cssp/api build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "run", "start", "-w", "apps/api"]
