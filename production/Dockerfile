# syntax=docker/dockerfile:1

FROM node:16.14.2-bullseye

RUN apt update && apt install -y ca-certificates

ENV NODE_ENV=production
WORKDIR /app

COPY ["package.json", "./"]
RUN npm install --production

ARG TEMPORAL_SERVER="host.docker.internal:7233"
ENV TEMPORAL_SERVER=$TEMPORAL_SERVER

ARG NAMESPACE="default"
ENV NAMESPACE=$NAMESPACE

COPY . .
CMD [ "node", "lib/worker.js" ]