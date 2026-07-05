import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");

export const otpSchema = z
  .string()
  .length(6, "Kod 6 xonadan iborat bo'lishi kerak");

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const attendanceCheckInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  wifiSSID: z.string().optional(),
  mockLocation: z.boolean().default(false),
  deviceInfo: z.string().optional(),
});

export const meetingCreateSchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  agenda: z.string().optional(),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  isOnline: z.boolean().default(false),
  meetingLink: z.string().url().optional(),
  participantIds: z.array(z.string()).min(1),
  overseerIds: z.array(z.string()).optional(),
});

export type PhoneInput = z.infer<typeof phoneSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type AttendanceCheckInInput = z.infer<typeof attendanceCheckInSchema>;
export type MeetingCreateInput = z.infer<typeof meetingCreateSchema>;
