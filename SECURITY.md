# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

Report security issues to security@uychimajlis.uz. Do not use public issues.

## Security Architecture

### Authentication
- **Passwordless OTP**: Phone-based OTP via Eskiz.uz SMS provider
- **JWT Tokens**: Short-lived access (15m) + long-lived refresh (7d)
- **Token Rotation**: Refresh token changes on each use
- **2FA**: TOTP (RFC 6238) with 8 backup recovery codes
- **Session Management**: Tracked by device, IP, location; remote termination
- **Biometric**: Local authentication via Expo LocalAuthentication

### Data Protection
- **At Rest**: PostgreSQL encrypted at disk level (configurable)
- **Selfies**: AES-256-GCM encrypted before disk storage
- **In Transit**: TLS enforced in production via Nginx
- **PII**: Minimal collection (phone, name, position only)
- **Audit Trail**: SHA-256 hash chain linking all log entries

### Access Control
- **Roles**: SUPER_ADMIN, DEPARTMENT_HEAD, EMPLOYEE
- **Permissions**: Fine-grained resource+action model
- **API Keys**: Scoped to specific endpoints with IP allowlisting
- **Rate Limiting**: Per-route + global limits to prevent abuse

### Network Security
- **Helmet**: HTTP headers (HSTS, CSP, X-Frame, etc.)
- **CORS**: Origin validation, restricted methods/headers
- **Input Validation**: Zod schemas on all endpoints
- **XSS Prevention**: Input sanitization middleware
- **Body Size**: 10MB limit on requests

### Monitoring & Detection
- **Suspicious Activities**: Mock location, out-of-hours access, rapid failures
- **Audit Chain**: Immutable log with integrity verification endpoint
- **Metrics**: Prometheus for anomaly detection baselines
- **Alerts**: Sentry for error tracking, configured thresholds

## Security Checklist

- [ ] Change all default secrets in production
- [ ] Enable SSL/TLS certificate
- [ ] Configure database firewall (allow only app server IP)
- [ ] Set up automated database backups
- [ ] Enable audit log monitoring alerts
- [ ] Review API key usage regularly
- [ ] Test face verification bypass scenarios
- [ ] Verify rate limiting effectiveness with load testing
- [ ] Review Sentry alerts and error grouping
- [ ] Run dependency vulnerability scan (`pnpm audit`)
