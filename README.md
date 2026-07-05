# UYCHI MAJLIS

Government Internal Attendance and Meeting Management Platform.

## Tech Stack

### Frontend
- React Native (Expo Bare Workflow)
- TypeScript
- NativeWind
- React Navigation v7
- TanStack Query
- Zustand
- React Hook Form + Zod
- Expo Notifications, Camera, Location, Secure Store

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL 16 + Prisma ORM (19 models, 30+ indexes)
- Redis 7 (caching, BullMQ queues, session store)
- JWT Auth (Access + Refresh Token, auto-refresh queue)
- OTP SMS via Eskiz.uz + Email via Nodemailer
- WebSocket (ws) for real-time chat & notifications
- TOTP 2FA (RFC 6238) with backup recovery codes
- Face verification (perceptual hash + Hamming distance)
- Document generation (PDF via PDFKit, Excel via ExcelJS)
- iCal calendar export
- Prometheus metrics + Sentry error tracking

### Infrastructure
- Docker + Docker Compose (Postgres, Redis, Backend, Nginx, MinIO)
- Prometheus + Grafana monitoring stack (app, node, redis metrics)
- Nginx reverse proxy with SSL
- PM2 cluster mode (multi-core)
- MinIO object storage (selfies, documents)
- Cloudflare Tunnel (optional)
- GitHub Actions CI/CD (lint, test, build, deploy)

## Project Structure

```
uychi-majlis/
├── apps/
│   ├── backend/           # Express.js API server
│   │   ├── prisma/        # Database schema & migrations
│   │   └── src/
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── jobs/
│   │       ├── utils/
│   │       └── __tests__/
│   └── mobile/            # React Native app
│       └── src/
│           ├── screens/
│           ├── components/
│           ├── navigation/
│           ├── services/
│           ├── hooks/
│           ├── store/
│           └── utils/
├── packages/
│   ├── shared/            # Shared utilities
│   ├── ui/                # Shared UI components
│   ├── types/             # Shared TypeScript types
│   └── config/            # Shared configuration
├── docker/
│   ├── Dockerfile.backend
│   ├── docker-compose.yml
│   ├── docker-compose.monitoring.yml
│   ├── nginx.conf
│   ├── prometheus/          # Prometheus config
│   └── grafana/             # Grafana dashboards
├── load-tests/              # k6 load test scripts
├── postman_collection.json  # Postman API collection
├── .env.example
├── .github/workflows/     # CI/CD
└── scripts/               # Helper scripts
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Environment Setup

```bash
cp .env.example apps/backend/.env
# Edit .env with your configuration
```

### Development

```bash
# Install dependencies
pnpm install

# Start database services
docker compose -f docker/docker-compose.yml up postgres redis -d

# Generate Prisma client and run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start backend
pnpm dev:backend
```

### Backend Development Server

The API server starts at `http://localhost:4000`.

API Documentation: `http://localhost:4000/api-docs`

## API Endpoints

### Authentication
- `POST /api/v1/auth/request-otp` - Request OTP code
- `POST /api/v1/auth/verify-otp` - Verify OTP and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### Attendance
- `POST /api/v1/attendance/check-in` - Check in (with selfie)
- `POST /api/v1/attendance/check-out` - Check out
- `GET /api/v1/attendance/today` - Today's attendance
- `GET /api/v1/attendance/history` - Attendance history
- `GET /api/v1/attendance/stats` - Attendance statistics

### Meetings
- `POST /api/v1/meetings` - Create meeting
- `GET /api/v1/meetings/my` - My meetings
- `GET /api/v1/meetings/pending` - Pending invitations
- `GET /api/v1/meetings/:id` - Meeting details
- `POST /api/v1/meetings/:id/confirm` - Confirm participation
- `POST /api/v1/meetings/:id/cancel` - Cancel meeting
- `GET /api/v1/meetings/:id/qr-code` - Get meeting QR code
- `POST /api/v1/meetings/scan-qr` - Scan QR to confirm attendance
- `GET /api/v1/meetings/department/:departmentId` - Department meetings

### Users
- `GET /api/v1/users/profile` - Get profile
- `PATCH /api/v1/users/profile` - Update profile
- `PUT /api/v1/users/preferences` - Language & theme preferences

### Sessions
- `GET /api/v1/sessions` - Active sessions
- `DELETE /api/v1/sessions/:id` - Terminate session
- `DELETE /api/v1/sessions/all` - Terminate all sessions

### 2FA (Two-Factor Authentication)
- `GET /api/v1/two-factor/status` - TOTP status
- `POST /api/v1/two-factor/enable` - Enable with backup codes
- `POST /api/v1/two-factor/verify` - Verify TOTP token
- `POST /api/v1/two-factor/disable` - Disable 2FA

### Messages (Internal Chat)
- `POST /api/v1/messages` - Send message
- `GET /api/v1/messages/conversations` - Conversation list
- `GET /api/v1/messages/unread` - Unread count
- `GET /api/v1/messages/:employeeId` - Chat history with employee

### Calendar
- `GET /api/v1/calendar/export` - Export calendar (.ics)
- `GET /api/v1/calendar/meeting/:meetingId` - Single meeting iCal

### Documents & Reports
- `GET /api/v1/documents/attendance-certificate/:employeeId` - PDF certificate
- `GET /api/v1/documents/meeting-minutes/:meetingId` - PDF minutes
- `POST /api/v1/documents/order` - Generate order document
- `GET /api/v1/reports/excel` - Excel attendance report
- `GET /api/v1/reports/pdf` - PDF attendance report

### Face Verification
- `POST /api/v1/face/reference-photo` - Upload reference photo
- `POST /api/v1/face/verify` - Verify selfie against reference
- `GET /api/v1/face/status` - Reference photo status

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard statistics
- `GET /api/v1/admin/employees` - List employees
- `POST /api/v1/admin/employees` - Create employee
- `POST /api/v1/admin/employees/import` - CSV/Excel bulk import
- `GET /api/v1/admin/suspicious-activities` - Suspicious activities
- `GET /api/v1/admin/maintenance` - Maintenance mode status
- `POST /api/v1/admin/maintenance` - Toggle maintenance mode

### Organizations & Departments
- `POST /api/v1/organizations` - Create organization
- `GET /api/v1/organizations` - List organizations
- `GET /api/v1/organizations/:id` - Get organization details
- `PUT /api/v1/organizations/:id` - Update organization
- `GET /api/v1/departments` - List departments
- `POST /api/v1/departments` - Create department

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `GET /api/v1/notifications/unread-count` - Unread count

### Audit
- `GET /api/v1/audit` - Get audit logs
- `GET /api/v1/audit/verify/:id` - Verify single audit entry integrity
- `GET /api/v1/audit/verify-chain` - Verify full audit chain integrity

### App Version
- `GET /api/v1/app/check-version` - Check app update availability
- `POST /api/v1/app/versions` - Register new version (admin)

### API Keys (Admin)
- `GET /api/v1/api-keys` - List API keys
- `POST /api/v1/api-keys` - Create API key
- `DELETE /api/v1/api-keys/:id` - Revoke API key

### Monitoring
- `GET /health` - Service health (DB, Redis, uptime, memory)
- `GET /metrics` - Prometheus metrics (HTTP, DB, Redis, memory)

## Security Features

- JWT Access & Refresh Token rotation with automatic refresh queue
- OTP SMS authentication (passwordless, Eskiz.uz provider)
- Two-Factor Authentication (TOTP RFC 6238) with backup codes
- Rate limiting per-route + global (configurable window/max)
- Helmet security headers (HSTS, CSP, X-Frame, etc.)
- CORS with origin validation
- Input validation (Zod schemas)
- Encrypted selfie storage (AES-256-GCM)
- SQL injection protection (parameterized Prisma queries)
- Audit log with SHA-256 hash chain (tamper detection)
- Mock location detection on mobile check-in
- Geofence radius validation (Haversine formula)
- Session management (device tracking, remote termination)
- API key authentication for 3rd party integrations
- Maintenance mode (Redis-based, zero restart)
- Data retention policies (auto cleanup old records)
- Input sanitization (XSS prevention)
- Body size limiting

## Deployment

```bash
# Build and start all services
docker compose -f docker/docker-compose.yml up -d --build

# Run database migrations
docker compose -f docker/docker-compose.yml exec backend npx prisma migrate deploy

# Seed database (first time)
docker compose -f docker/docker-compose.yml exec backend npx tsx prisma/seed.ts
```

## Testing

```bash
# Unit and integration tests
pnpm test

# With coverage
pnpm test -- --coverage
```
