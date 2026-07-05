import { LinkingOptions } from "@react-navigation/native";
import { RootStackParamList } from "./types";

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    "uychimajlis://",
    "https://uychi-majlis.uz",
    "https://*.uychi-majlis.uz",
  ],
  config: {
    screens: {
      Login: "login",
      OtpVerification: "verify/:phone",
      MainTabs: {
        screens: {
          Home: "home",
          Meetings: "meetings",
          Notifications: "notifications",
          Profile: "profile",
        },
      },
      CheckIn: "check-in",
      CheckOut: "check-out",
      MeetingDetail: "meeting/:meetingId",
      AttendanceHistory: "attendance/history",
      Statistics: "attendance/stats",
      DepartmentAttendance: "department/:departmentId/attendance",
      CreateMeeting: "meetings/create",
      DepartmentReports: "department/:departmentId/reports",
      EmployeesRegistry: "admin/employees",
      OrganizationsManagement: "admin/organizations",
      AuditLogs: "admin/audit",
      ReportsCenter: "admin/reports",
      SuspiciousActivities: "admin/suspicious",
      OrganizationSettings: "admin/org-settings",
      MeetingMonitoringDashboard: "admin/monitoring",
      CreateGlobalMeeting: "admin/meetings/create-global",
      SystemSettings: "admin/system-settings",
      Settings: "settings",
      TwoFactorSetup: "settings/2fa",
      SessionManagement: "settings/sessions",
      Conversations: "messages",
      ChatMessages: "messages/:employeeId/:fullName",
      Documents: "documents",
      FaceVerification: "face-verification",
      QRScanner: "qr-scanner",
      EmployeeDirectory: "employees",
      CreateOrder: "documents/create-order",
    },
  },
};

export default linking;
