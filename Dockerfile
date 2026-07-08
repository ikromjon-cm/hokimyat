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
# Pre-fetch the schema/migration engine at build time (no DB needed) so it is
# present in node_modules and `migrate deploy` never downloads it at runtime.
RUN npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /dev/null 2>&1 || true
RUN npx tsc --outDir dist

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express

WORKDIR /app

# Own everything as the non-root express user so the Prisma CLI can write to
# node_modules/@prisma/engines during `migrate deploy` at container start.
COPY --from=builder --chown=express:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=express:nodejs /app/apps/backend/prisma ./prisma
COPY --from=builder --chown=express:nodejs /app/apps/backend/package.json ./
COPY --from=builder --chown=express:nodejs /app/node_modules ./node_modules
COPY --chown=express:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p uploads/selfies && chown express:nodejs uploads/selfies \
    && chmod +x docker-entrypoint.sh

USER express

EXPOSE 4000

CMD ["./docker-entrypoint.sh"]
