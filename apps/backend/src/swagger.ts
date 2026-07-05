import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "UYCHI MAJLIS API",
      version: "1.1.0",
      description: `Hokimiyat ichki davomat va majlis boshqaruv tizimi

## Xususiyatlar
- **Auth**: Passwordless OTP (SMS), JWT access+refresh, 2FA (TOTP), session management
- **Attendance**: Geofence (Haversine), WiFi SSID, mock detection, selfie verification, QR check-in
- **Meetings**: CRUD, participants, overseers, QR codes, iCal export, PDF minutes
- **Reports**: Excel/PDF with department/employee/date filters
- **Monitoring**: Health check, Prometheus metrics, Sentry error tracking, WebSocket real-time
- **Security**: Rate limiting, input sanitization, audit hash chain, AES-256 encrypted storage
- **i18n**: uz/ru/en multi-language support
- **Messaging**: Internal chat between employees via WebSocket`,
      contact: { name: "Support", email: "support@uychimajlis.uz" },
    },
    servers: [
      { url: "http://localhost:4000", description: "Rivojlanish" },
      { url: "https://api.uychimajlis.uz", description: "Ishlab chiqarish" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                code: { type: "string" },
                errors: { type: "object" },
              },
            },
          },
        },
        OtpRequest: {
          type: "object", required: ["phone"],
          properties: { phone: { type: "string", example: "+998901234567" } },
        },
        OtpVerify: {
          type: "object", required: ["phone", "code"],
          properties: {
            phone: { type: "string", example: "+998901234567" },
            code: { type: "string", example: "123456" },
            deviceId: { type: "string" },
            deviceName: { type: "string" },
            pushToken: { type: "string" },
          },
        },
        TokenResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                phone: { type: "string" },
                fullName: { type: "string" },
                role: { type: "string" },
                organization: { type: "object" },
                department: { type: "object" },
                employeeId: { type: "string" },
              },
            },
          },
        },
        AttendanceCheckIn: {
          type: "object", required: ["latitude", "longitude"],
          properties: {
            latitude: { type: "number", example: 41.311081 },
            longitude: { type: "number", example: 69.279737 },
            wifiSSID: { type: "string", example: "OFFICE_WIFI" },
            mockLocation: { type: "boolean", default: false },
            deviceInfo: { type: "string" },
          },
        },
        Meeting: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            agenda: { type: "string" },
            date: { type: "string", format: "date" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            location: { type: "string" },
            isOnline: { type: "boolean" },
            meetingLink: { type: "string" },
            status: { type: "string", enum: ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"] },
            participants: { type: "array", items: { $ref: "#/components/schemas/MeetingParticipant" } },
          },
        },
        MeetingParticipant: {
          type: "object",
          properties: {
            id: { type: "string" },
            employeeId: { type: "string" },
            status: { type: "string", enum: ["PENDING", "CONFIRMED", "DECLINED", "ABSENT", "PRESENT"] },
            isPresent: { type: "boolean" },
            checkedInAt: { type: "string", format: "date-time" },
            checkInMethod: { type: "string", enum: ["MANUAL", "QR"] },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            phone: { type: "string" },
            fullName: { type: "string" },
            status: { type: "string", enum: ["ACTIVE", "INACTIVE", "BLOCKED"] },
            role: { $ref: "#/components/schemas/Role" },
            organization: { type: "object" },
            department: { type: "object" },
            languagePreference: { type: "string", enum: ["uz", "ru", "en"] },
            themePreference: { type: "string", enum: ["system", "light", "dark"] },
          },
        },
        Role: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } },
        Organization: {
          type: "object",
          properties: {
            id: { type: "string" }, name: { type: "string" }, shortName: { type: "string" },
            address: { type: "string" }, phone: { type: "string" }, email: { type: "string" },
            latitude: { type: "number" }, longitude: { type: "number" },
            geofenceRadius: { type: "number" }, wifiSSID: { type: "string" },
          },
        },
        Department: {
          type: "object",
          properties: { id: { type: "string" }, name: { type: "string" }, code: { type: "string" } },
        },
        Employee: {
          type: "object",
          properties: {
            id: { type: "string" }, employeeCode: { type: "string" }, position: { type: "string" },
            email: { type: "string" }, user: { $ref: "#/components/schemas/User" },
            department: { $ref: "#/components/schemas/Department" },
          },
        },
        Session: {
          type: "object",
          properties: {
            id: { type: "string" }, ipAddress: { type: "string" }, deviceInfo: { type: "string" },
            location: { type: "string" }, lastActivity: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" }, expiresAt: { type: "string", format: "date-time" },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string" }, content: { type: "string" },
            senderId: { type: "string" }, receiverId: { type: "string" },
            isRead: { type: "boolean" }, createdAt: { type: "string", format: "date-time" },
            sender: { type: "object", properties: { user: { type: "object", properties: { fullName: { type: "string" } } } } },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "string" }, name: { type: "string" }, keyPrefix: { type: "string" },
            isActive: { type: "boolean" }, rateLimitPerMinute: { type: "integer" },
            lastUsedAt: { type: "string", format: "date-time" },
            expiresAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        FaceVerificationResult: {
          type: "object",
          properties: {
            verified: { type: "boolean" }, confidence: { type: "number" }, reason: { type: "string" },
          },
        },
        VersionCheckResult: {
          type: "object",
          properties: {
            updateAvailable: { type: "boolean" }, isForceUpdate: { type: "boolean" },
            latestVersion: { type: "string" }, latestBuildNumber: { type: "integer" },
            updateUrl: { type: "string" }, releaseNotes: { type: "string" },
          },
        },
        RetentionConfig: {
          type: "object",
          properties: {
            entityType: { type: "string", enum: ["ATTENDANCE", "AUDIT_LOG", "NOTIFICATION", "SESSION"] },
            retentionDays: { type: "integer" }, action: { type: "string", default: "DELETE" },
            isEnabled: { type: "boolean" },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      "/health": {
        get: {
          tags: ["Monitoring"], summary: "Sog'liqni tekshirish",
          description: "DB, Redis, uptime, memory holatini qaytaradi",
          responses: { "200": { description: "OK" }, "503": { description: "Degraded" } },
        },
      },
      "/metrics": {
        get: {
          tags: ["Monitoring"], summary: "Prometheus metrikalari",
          description: "Prometheus formatidagi metrikalar",
          responses: { "200": { description: "Metrics" } },
        },
      },
      "/api/v1/auth/request-otp": {
        post: {
          tags: ["Auth"], summary: "OTP kod so'rash",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OtpRequest" } } } },
          responses: { "200": { description: "OTP yuborildi" }, "429": { description: "Ko'p urinish" } },
        },
      },
      "/api/v1/auth/verify-otp": {
        post: {
          tags: ["Auth"], summary: "OTP kodni tasdiqlash",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OtpVerify" } } } },
          responses: { "200": { description: "Tokenlar", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } } },
        },
      },
      "/api/v1/auth/refresh": {
        post: { tags: ["Auth"], summary: "Tokenni yangilash", responses: { "200": { description: "Yangi token" } } },
      },
      "/api/v1/auth/logout": {
        post: { tags: ["Auth"], summary: "Tizimdan chiqish", security: [{ BearerAuth: [] }], responses: { "200": { description: "Chiqildi" } } },
      },
      "/api/v1/attendance/check-in": {
        post: {
          tags: ["Attendance"], summary: "Kirishni belgilash",
          requestBody: { required: true, content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/AttendanceCheckIn" } } } },
          responses: { "200": { description: "Kelish belgilandi" }, "400": { description: "Xatolik" } },
        },
      },
      "/api/v1/attendance/check-out": {
        post: { tags: ["Attendance"], summary: "Chiqishni belgilash", responses: { "200": { description: "Ketish belgilandi" } } },
      },
      "/api/v1/attendance/today": {
        get: { tags: ["Attendance"], summary: "Bugungi davomat", responses: { "200": { description: "Davomat" } } },
      },
      "/api/v1/attendance/history": {
        get: { tags: ["Attendance"], summary: "Davomat tarixi", responses: { "200": { description: "Tarix" } } },
      },
      "/api/v1/attendance/stats": {
        get: { tags: ["Attendance"], summary: "Davomat statistikasi", responses: { "200": { description: "Statistika" } } },
      },
      "/api/v1/meetings/my": {
        get: { tags: ["Meetings"], summary: "Mening uchrashuvlarim", responses: { "200": { description: "Uchrashuvlar" } } },
      },
      "/api/v1/meetings/pending": {
        get: { tags: ["Meetings"], summary: "Kutilayotgan takliflar", responses: { "200": { description: "Takliflar" } } },
      },
      "/api/v1/meetings/{id}": {
        get: { tags: ["Meetings"], summary: "Uchrashuv tafsilotlari", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Uchrashuv" } } },
      },
      "/api/v1/meetings": {
        post: { tags: ["Meetings"], summary: "Uchrashuv yaratish", responses: { "201": { description: "Yaratildi" } } },
      },
      "/api/v1/meetings/{id}/confirm": {
        post: { tags: ["Meetings"], summary: "Qatnashishni tasdiqlash", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Tasdiqlandi" } } },
      },
      "/api/v1/meetings/{id}/cancel": {
        post: { tags: ["Meetings"], summary: "Uchrashuvni bekor qilish", responses: { "200": { description: "Bekor qilindi" } } },
      },
      "/api/v1/meetings/{id}/qr-code": {
        get: { tags: ["Meetings"], summary: "QR kod olish", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, { name: "format", in: "query", schema: { type: "string", enum: ["png", "json"] } }], responses: { "200": { description: "QR kod" } } },
      },
      "/api/v1/meetings/scan-qr": {
        post: { tags: ["Meetings"], summary: "QR kodni skanerlash", responses: { "200": { description: "Qatnashish tasdiqlandi" } } },
      },
      "/api/v1/meetings/department/{departmentId}": {
        get: { tags: ["Meetings"], summary: "Bo'lim uchrashuvlari", responses: { "200": { description: "Uchrashuvlar" } } },
      },
      "/api/v1/users/profile": {
        get: { tags: ["Users"], summary: "Profil ma'lumotlari", responses: { "200": { description: "Profil", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } } } },
        patch: { tags: ["Users"], summary: "Profilni yangilash", responses: { "200": { description: "Yangilandi" } } },
      },
      "/api/v1/users/preferences": {
        put: { tags: ["Users"], summary: "Til va mavzu sozlamalari", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { languagePreference: { type: "string", enum: ["uz", "ru", "en"] }, themePreference: { type: "string", enum: ["system", "light", "dark"] } } } } } }, responses: { "200": { description: "Sozlandi" } } },
      },
      "/api/v1/organizations": {
        get: { tags: ["Organizations"], summary: "Tashkilotlar ro'yxati", responses: { "200": { description: "Tashkilotlar" } } },
        post: { tags: ["Organizations"], summary: "Tashkilot yaratish", responses: { "201": { description: "Yaratildi" } } },
      },
      "/api/v1/organizations/{id}": {
        get: { tags: ["Organizations"], summary: "Tashkilot tafsilotlari", responses: { "200": { description: "Tashkilot", content: { "application/json": { schema: { $ref: "#/components/schemas/Organization" } } } } } },
        put: { tags: ["Organizations"], summary: "Tashkilotni yangilash", responses: { "200": { description: "Yangilandi" } } },
      },
      "/api/v1/departments": {
        get: { tags: ["Departments"], summary: "Bo'limlar ro'yxati", responses: { "200": { description: "Bo'limlar" } } },
        post: { tags: ["Departments"], summary: "Bo'lim yaratish", responses: { "201": { description: "Yaratildi" } } },
      },
      "/api/v1/departments/{id}": {
        get: { tags: ["Departments"], summary: "Bo'lim tafsilotlari", responses: { "200": { description: "Bo'lim" } } },
        put: { tags: ["Departments"], summary: "Bo'limni yangilash", responses: { "200": { description: "Yangilandi" } } },
      },
      "/api/v1/reports/excel": {
        get: { tags: ["Reports"], summary: "Excel hisobot", responses: { "200": { description: "Excel fayl" } } },
      },
      "/api/v1/reports/pdf": {
        get: { tags: ["Reports"], summary: "PDF hisobot", responses: { "200": { description: "PDF fayl" } } },
      },
      "/api/v1/notifications": {
        get: { tags: ["Notifications"], summary: "Bildirishnomalar", responses: { "200": { description: "Bildirishnomalar" } } },
      },
      "/api/v1/audit": {
        get: { tags: ["Audit"], summary: "Audit jurnali", responses: { "200": { description: "Audit yozuvlari" } } },
      },
      "/api/v1/audit/verify-chain": {
        get: { tags: ["Audit"], summary: "Audit zanjirini tekshirish", responses: { "200": { description: "Tekshirish natijasi" } } },
      },
      "/api/v1/sessions": {
        get: { tags: ["Sessions"], summary: "Faol sessiyalar", responses: { "200": { description: "Sessiyalar", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Session" } } } } } } },
      },
      "/api/v1/sessions/all": {
        delete: { tags: ["Sessions"], summary: "Barcha sessiyalarni tugatish", responses: { "200": { description: "Tugatildi" } } },
      },
      "/api/v1/sessions/{id}": {
        delete: { tags: ["Sessions"], summary: "Sessiyani tugatish", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Tugatildi" } } },
      },
      "/api/v1/two-factor/status": {
        get: { tags: ["2FA"], summary: "2FA holati", responses: { "200": { description: "Holat" } } },
      },
      "/api/v1/two-factor/enable": {
        post: { tags: ["2FA"], summary: "2FA yoqish", responses: { "200": { description: "Secret va backup codes" } } },
      },
      "/api/v1/two-factor/verify": {
        post: { tags: ["2FA"], summary: "2FA token tasdiqlash", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { token: { type: "string" } } } } } }, responses: { "200": { description: "Tasdiqlandi" } } },
      },
      "/api/v1/two-factor/disable": {
        post: { tags: ["2FA"], summary: "2FA o'chirish", responses: { "200": { description: "O'chirildi" } } },
      },
      "/api/v1/messages": {
        post: { tags: ["Messages"], summary: "Xabar yuborish", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { receiverEmployeeId: { type: "string" }, content: { type: "string" } } } } } }, responses: { "201": { description: "Xabar", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } } } },
      },
      "/api/v1/messages/conversations": {
        get: { tags: ["Messages"], summary: "Suhbatlar ro'yxati", responses: { "200": { description: "Suhbatlar" } } },
      },
      "/api/v1/messages/unread": {
        get: { tags: ["Messages"], summary: "O'qilmagan xabarlar soni", responses: { "200": { description: "Soni" } } },
      },
      "/api/v1/messages/{employeeId}": {
        get: { tags: ["Messages"], summary: "Xabarlar tarixi", parameters: [{ name: "employeeId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Xabarlar" } } },
      },
      "/api/v1/calendar/export": {
        get: { tags: ["Calendar"], summary: "Kalendarni eksport qilish (.ics)", responses: { "200": { description: "iCal fayl" } } },
      },
      "/api/v1/calendar/meeting/{meetingId}": {
        get: { tags: ["Calendar"], summary: "Uchrashuvni kalendar (.ics)", responses: { "200": { description: "iCal fayl" } } },
      },
      "/api/v1/documents/attendance-certificate/{employeeId}": {
        get: { tags: ["Documents"], summary: "Davomat ma'lohnomasi (PDF)", responses: { "200": { description: "PDF fayl" } } },
      },
      "/api/v1/documents/meeting-minutes/{meetingId}": {
        get: { tags: ["Documents"], summary: "Majlis bayoni (PDF)", responses: { "200": { description: "PDF fayl" } } },
      },
      "/api/v1/documents/order": {
        post: { tags: ["Documents"], summary: "Buyruq yaratish (PDF)", responses: { "200": { description: "PDF fayl" } } },
      },
      "/api/v1/face/reference-photo": {
        post: { tags: ["Face Verification"], summary: "Malumot uchun rasm yuklash", responses: { "200": { description: "Saqlandi" } } },
      },
      "/api/v1/face/verify": {
        post: { tags: ["Face Verification"], summary: "Selfi tekshirish", responses: { "200": { description: "Natija", content: { "application/json": { schema: { $ref: "#/components/schemas/FaceVerificationResult" } } } } } },
      },
      "/api/v1/face/status": {
        get: { tags: ["Face Verification"], summary: "Malumot rasmi holati", responses: { "200": { description: "Holat" } } },
      },
      "/api/v1/retention": {
        get: { tags: ["Retention"], summary: "Ma'lumotlarni saqlash sozlamalari", security: [{ BearerAuth: [] }], responses: { "200": { description: "Sozlamalar", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/RetentionConfig" } } } } } } },
      },
      "/api/v1/retention/{entityType}": {
        put: { tags: ["Retention"], summary: "Saqlash muddatini yangilash", security: [{ BearerAuth: [] }], parameters: [{ name: "entityType", in: "path", required: true, schema: { type: "string", enum: ["ATTENDANCE", "AUDIT_LOG", "NOTIFICATION", "SESSION"] } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { retentionDays: { type: "integer" }, action: { type: "string", default: "DELETE" } } } } } }, responses: { "200": { description: "Yangilandi" } } },
      },
      "/api/v1/retention/apply": {
        post: { tags: ["Retention"], summary: "Saqlash siyosatini qo'llash", security: [{ BearerAuth: [] }], responses: { "200": { description: "Natija" } } },
      },
      "/api/v1/app/check-version": {
        get: { tags: ["App"], summary: "Versiyani tekshirish", parameters: [{ name: "platform", in: "query", schema: { type: "string", enum: ["ANDROID", "IOS"] } }, { name: "version", in: "query", schema: { type: "string" } }, { name: "buildNumber", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Natija", content: { "application/json": { schema: { $ref: "#/components/schemas/VersionCheckResult" } } } } } },
      },
      "/api/v1/app/versions": {
        post: { tags: ["App"], summary: "Yangi versiya qo'shish", responses: { "201": { description: "Yaratildi" } } },
      },
      "/api/v1/admin/dashboard": {
        get: { tags: ["Admin"], summary: "Dashboard statistikasi", responses: { "200": { description: "Dashboard" } } },
      },
      "/api/v1/admin/employees": {
        get: { tags: ["Admin"], summary: "Xodimlar ro'yxati", responses: { "200": { description: "Xodimlar" } } },
        post: { tags: ["Admin"], summary: "Xodim yaratish", responses: { "201": { description: "Yaratildi" } } },
      },
      "/api/v1/admin/employees/import": {
        post: { tags: ["Admin"], summary: "CSV import", requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } }, responses: { "200": { description: "Import natijasi" } } },
      },
      "/api/v1/admin/suspicious-activities": {
        get: { tags: ["Admin"], summary: "Shubhali faoliyatlar", responses: { "200": { description: "Ro'yxat" } } },
      },
      "/api/v1/api-keys": {
        get: { tags: ["API Keys"], summary: "API kalitlar ro'yxati", security: [{ BearerAuth: [] }], responses: { "200": { description: "Kalitlar" } } },
        post: { tags: ["API Keys"], summary: "Yangi API kalit yaratish", security: [{ BearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, permissions: { type: "array", items: { type: "string" } }, rateLimitPerMinute: { type: "integer" } } } } } }, responses: { "201": { description: "Kalit yaratildi" } } },
      },
      "/api/v1/api-keys/{id}": {
        delete: { tags: ["API Keys"], summary: "API kalitni bekor qilish", security: [{ BearerAuth: [] }], responses: { "200": { description: "Bekor qilindi" } } },
      },
      "/api/v1/admin/maintenance": {
        get: { tags: ["Admin"], summary: "Xizmat rejimi holati", responses: { "200": { description: "Holat" } } },
        post: { tags: ["Admin"], summary: "Xizmat rejimini yoqish/o'chirish", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { enabled: { type: "boolean" }, message: { type: "string" } } } } } }, responses: { "200": { description: "O'zgartirildi" } } },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
