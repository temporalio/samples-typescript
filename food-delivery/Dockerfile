FROM node:18-bullseye AS builder

WORKDIR /app
COPY . .

RUN npm install && npm run build


FROM node:18-bullseye

WORKDIR /app
COPY --from=builder /app /app

ENV NODE_ENV production
ENV TEMPORAL_SERVER loren.temporal-dev.tmprl.cloud:7233
ENV NAMESPACE loren.temporal-dev

RUN npm install

CMD ["node", "apps/worker/lib/worker.js"]

