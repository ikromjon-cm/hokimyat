# UYCHI MAJLIS Deployment Guide

## Prerequisites

- Docker & Docker Compose v2+
- Node.js 20+
- pnpm 9+
- PostgreSQL 16
- Redis 7
- Nginx
- Domain name with SSL certificate
- Cloudflare account (for tunnel)

## Environment Variables

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - 32+ char random string
- `JWT_REFRESH_SECRET` - 32+ char random string
- `REDIS_URL` - Redis connection string
- `ESKIZ_EMAIL` - Eskiz.uz SMS provider email
- `ESKIZ_PASSWORD` - Eskiz.uz SMS provider password
- `EXPO_ACCESS_TOKEN` - Expo push notification token
- `SELFIE_ENCRYPTION_KEY` - 32 char encryption key

## Production Deployment

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/uychi-majlis.git
cd uychi-majlis
cp .env.example .env
# Edit .env with production values
```

### 2. Deploy with Docker Compose

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### 3. Run Database Migrations

```bash
docker compose -f docker/docker-compose.yml exec backend npx prisma migrate deploy
```

### 4. Seed Initial Data

```bash
docker compose -f docker/docker-compose.yml exec backend npx tsx prisma/seed.ts
```

### 5. Setup SSL with Let's Encrypt

```bash
docker run -it --rm -p 80:80 -p 443:443 \
  -v ./docker/ssl:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d api.uychimajlis.uz
```

### 6. Configure Nginx

Edit `docker/nginx.conf` with your domain and SSL paths.

### 7. Setup Cloudflare Tunnel (Optional)

```bash
cloudflared tunnel create uychi-majlis
cloudflared tunnel route dns uychi-majlis api.uychimajlis.uz
```

## PM2 Deployment (Alternative)

```bash
# Install PM2 globally
npm i -g pm2

# Build and start
cd apps/backend
npm run build
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save
pm2 startup
```

## Mobile App Build

### Android APK

```bash
cd apps/mobile
eas build --platform android --profile production
```

### iOS IPA

```bash
cd apps/mobile
eas build --platform ios --profile production
```

### OTA Updates (Expo Updates)

```bash
eas update --branch production --message "Production update"
```

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 status
pm2 logs uychi-majlis-backend
```

### Docker Monitoring

```bash
docker compose -f docker/docker-compose.yml logs -f
docker stats
```

### Redis Monitoring

```bash
redis-cli monitor
redis-cli info stats
```

## Backup

### Database Backup

```bash
docker exec uychi-majlis-db pg_dump -U postgres uychi_majlis > backup_$(date +%Y%m%d).sql
```

### Selfie Storage Backup

```bash
tar -czf selfies_backup_$(date +%Y%m%d).tar.gz uploads/selfies/
```

## Scaling

### Backend Horizontal Scaling

```bash
# In docker-compose.yml, scale backend service
docker compose up -d --scale backend=3
```

### Database Connection Pool

Configure PgBouncer for connection pooling when scaling backend instances.

## Troubleshooting

### Common Issues

1. **Database connection refused**: Ensure PostgreSQL is running and `DATABASE_URL` is correct.
2. **Redis connection failed**: Verify Redis is running on the specified host and port.
3. **SMS not sending**: Check Eskiz.uz credentials and account balance.
4. **Push notifications not working**: Verify Expo push token and device tokens.
5. **Selfie upload failing**: Check disk space and `uploads/selfies` directory permissions.

### Logs

```bash
# Backend logs
docker logs uychi-majlis-backend -f

# Nginx logs
docker logs uychi-majlis-nginx -f

# PostgreSQL logs
docker logs uychi-majlis-db -f
```

## Security Checklist

- [ ] JWT secrets changed from defaults
- [ ] SSL certificate installed
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] Database firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured
- [ ] Audit log integrity verified
- [ ] Selfie encryption confirmed
- [ ] API endpoints authenticated
