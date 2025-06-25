# ---------- api build aşaması ----------
FROM node:22-alpine AS api-builder
WORKDIR /usr/src/app/api

# 1) API kaynak kodunu kopyala
COPY api/ ./

# 2) Tüm bağımlılıkları (prod + dev) yükle
RUN npm install

# 3) Derle
RUN npm run build

# 4) Prisma client üret
RUN npx prisma generate --schema=prisma/schema.prisma

# ---------- prod image ----------
FROM node:22-alpine
WORKDIR /usr/src/app

# Derlenmiş artefaktları al
COPY --from=api-builder /usr/src/app/api/dist       ./dist
COPY --from=api-builder /usr/src/app/api/node_modules ./node_modules
COPY --from=api-builder /usr/src/app/api/prisma     ./prisma

# İşte eksik klasör:
COPY --from=api-builder /usr/src/app/api/generated   ./generated

ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
