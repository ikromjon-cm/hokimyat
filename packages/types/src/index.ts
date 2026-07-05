export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  fullName: string | null;
  role: string;
  organization?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  employeeId?: string | null;
}

export interface LoginResponse extends TokenPair {
  user: AuthUser;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  type: "CHECK_IN" | "CHECK_OUT";
  timestamp: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  confidence?: "HIGH" | "MEDIUM" | "LOW" | "REJECTED";
  wifiSSID?: string;
  wifiMatched: boolean;
  mockLocation: boolean;
  deviceInfo?: string;
  selfiePath?: string;
}

export interface Meeting {
  id: string;
  title: string;
  agenda?: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  isOnline: boolean;
  meetingLink?: string;
  participants: MeetingParticipant[];
  overseers: MeetingOverseer[];
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  employeeId: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "ABSENT" | "PRESENT";
  confirmedAt?: string;
  employee?: { user?: { fullName?: string } };
}

export interface MeetingOverseer {
  id: string;
  employee?: { user?: { fullName?: string } };
}

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  position?: string;
  isActive: boolean;
  user: {
    id: string;
    fullName?: string;
    phone: string;
  };
  department?: {
    id: string;
    name: string;
  };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  previousHash?: string;
  currentHash: string;
  createdAt: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

export interface DashboardStats {
  totalEmployees: number;
  totalOrganizations: number;
  todayCheckIns: number;
  activeMeetings: number;
  pendingConfirmations: number;
  suspiciousActivitiesToday: number;
}
