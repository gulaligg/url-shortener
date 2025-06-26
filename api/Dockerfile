# ---------- api build  ----------
FROM node:22-alpine AS api-builder
WORKDIR /usr/src/app/api

COPY api/ ./

RUN npm install

RUN npm run build

RUN npx prisma generate --schema=prisma/schema.prisma

# ---------- prod image ----------
FROM node:22-alpine
WORKDIR /usr/src/app

COPY --from=api-builder /usr/src/app/api/dist       ./dist
COPY --from=api-builder /usr/src/app/api/node_modules ./node_modules
COPY --from=api-builder /usr/src/app/api/prisma     ./prisma

COPY --from=api-builder /usr/src/app/api/generated   ./generated

ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
