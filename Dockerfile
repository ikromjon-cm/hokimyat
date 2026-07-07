FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/
COPY packages/ui/package.json packages/ui/

RUN npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
RUN npm rebuild sharp

COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src

COPY packages/shared/src ./packages/shared/src
COPY packages/types/src ./packages/types/src
COPY packages/config/src ./packages/config/src
COPY packages/ui/src ./packages/ui/src

WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npx tsc --outDir dist

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express

WORKDIR /app

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p uploads/selfies && chown express:nodejs uploads/selfies

USER express

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
