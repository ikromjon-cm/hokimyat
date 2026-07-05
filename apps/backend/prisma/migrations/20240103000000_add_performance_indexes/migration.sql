-- Performance optimization indexes for UYCHI MAJLIS

-- Users
CREATE INDEX IF NOT EXISTS "users_phone_status_idx" ON "users"("phone", "status");
CREATE INDEX IF NOT EXISTS "users_organization_status_idx" ON "users"("organization_id", "status");
CREATE INDEX IF NOT EXISTS "users_department_idx" ON "users"("department_id");

-- Employees
CREATE INDEX IF NOT EXISTS "employees_organization_department_idx" ON "employees"("organization_id", "department_id");
CREATE INDEX IF NOT EXISTS "employees_code_idx" ON "employees"("employee_code");
CREATE INDEX IF NOT EXISTS "employees_active_idx" ON "employees"("organization_id", "is_active");

-- Attendance (core table, many queries)
CREATE INDEX IF NOT EXISTS "attendance_employee_date_idx" ON "attendance"("employee_id", "created_at");
CREATE INDEX IF NOT EXISTS "attendance_org_date_idx" ON "attendance"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "attendance_type_date_idx" ON "attendance"("employee_id", "type", "created_at");
CREATE INDEX IF NOT EXISTS "attendance_confidence_idx" ON "attendance"("employee_id", "confidence");
CREATE INDEX IF NOT EXISTS "attendance_daily_idx" ON "attendance"("organization_id", "department_id", "created_at");

-- Meetings
CREATE INDEX IF NOT EXISTS "meetings_org_date_idx" ON "meetings"("organization_id", "date");
CREATE INDEX IF NOT EXISTS "meetings_status_idx" ON "meetings"("organization_id", "status");
CREATE INDEX IF NOT EXISTS "meetings_creator_idx" ON "meetings"("created_by_id");
CREATE INDEX IF NOT EXISTS "meetings_department_idx" ON "meetings"("department_id", "date");

-- Meeting Participants
CREATE INDEX IF NOT EXISTS "meeting_participants_employee_idx" ON "meeting_participants"("employee_id");
CREATE INDEX IF NOT EXISTS "meeting_participants_status_idx" ON "meeting_participants"("meeting_id", "status");
CREATE INDEX IF NOT EXISTS "meeting_participants_present_idx" ON "meeting_participants"("meeting_id", "is_present");

-- Notifications
CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notification_logs"("user_id", "is_read", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notification_logs"("user_id", "type");

-- OTP Codes (high-write table)
CREATE INDEX IF NOT EXISTS "otp_codes_phone_idx" ON "otp_codes"("phone", "is_used", "created_at");
CREATE INDEX IF NOT EXISTS "otp_codes_cleanup_idx" ON "otp_codes"("created_at") WHERE "is_used" = false;

-- Audit Logs (high-volume table)
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs"("actor_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_org_idx" ON "audit_logs"("organization_id", "created_at");

-- Devices
CREATE INDEX IF NOT EXISTS "devices_user_idx" ON "devices"("user_id", "is_active");

-- Messages
CREATE INDEX IF NOT EXISTS "messages_unread_idx" ON "messages"("receiver_id", "is_read", "created_at");

-- Sessions
CREATE INDEX IF NOT EXISTS "sessions_cleanup_idx" ON "sessions"("expires_at", "is_active");

-- Reports
CREATE INDEX IF NOT EXISTS "reports_generator_idx" ON "reports"("generated_by_id", "created_at");

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS "attendance_today_idx" ON "attendance"("employee_id", "type")
  WHERE "created_at" >= CURRENT_DATE;

CREATE INDEX IF NOT EXISTS "meetings_upcoming_idx" ON "meetings"("organization_id", "status", "start_time")
  WHERE "status" IN ('SCHEDULED', 'ONGOING');

CREATE INDEX IF NOT EXISTS "employees_active_org_idx" ON "employees"("organization_id")
  WHERE "is_active" = true;

-- Analyze tables for query planner
ANALYZE "users";
ANALYZE "employees";
ANALYZE "attendance";
ANALYZE "meetings";
ANALYZE "meeting_participants";
ANALYZE "notification_logs";
ANALYZE "otp_codes";
ANALYZE "audit_logs";
