FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install -g npm@10.8.2 \
  && npm install --include=dev --workspaces --no-audit --no-fund --ignore-scripts

COPY . .

RUN npm run build -w packages/shared \
  && npm run build -w apps/web \
  && npm run prisma:generate -w apps/api \
  && npm run build -w apps/api

ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "run", "start", "-w", "apps/api"]
