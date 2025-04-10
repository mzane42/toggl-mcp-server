FROM node:22.12-bullseye-slim AS builder

# プロジェクトのファイルをコピー
COPY src /app/src
COPY tsconfig.json /app/tsconfig.json
COPY package*.json /app/

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm npm install

# TypeScriptのコンパイルを実行
RUN npm run build

FROM node:22-bullseye-slim AS release

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production

WORKDIR /app

RUN npm ci --ignore-scripts --omit-dev

ENTRYPOINT ["node", "dist/index.js"]