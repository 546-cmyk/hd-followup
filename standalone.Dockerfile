FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN chmod +x scripts/build-standalone.sh && ./scripts/build-standalone.sh

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --legacy-peer-deps && \
    npm install @nestjs/jwt @nestjs/serve-static postgres drizzle-kit --legacy-peer-deps

COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts

EXPOSE 3000

CMD ["sh", "-c", "node scripts/run-migrations.js && node dist/server/main.standalone.js"]
