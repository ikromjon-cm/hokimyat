import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

interface CheckInData {
  latitude: number;
  longitude: number;
  wifiSSID?: string;
  mockLocation?: boolean;
  deviceInfo?: string;
}

interface CheckOutData {
  latitude: number;
  longitude: number;
  deviceInfo?: string;
}

interface AttendanceStats {
  presentDays: number;
  lateDays: number;
  absentDays: number;
  attendanceRate: number;
  totalWorkingDays: number;
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: ["todayAttendance"],
    queryFn: () => api.get("/attendance/today").then((r) => r.data),
  });
}

export function useAttendanceHistory(params?: {
  page?: number; limit?: number; startDate?: string; endDate?: string;
}) {
  return useQuery({
    queryKey: ["attendanceHistory", params],
    queryFn: () => api.get("/attendance/history", { params }).then((r) => r.data),
  });
}

export function useAttendanceStats(params?: {
  startDate?: string; endDate?: string;
}) {
  return useQuery<AttendanceStats>({
    queryKey: ["attendanceStats", params],
    queryFn: () => api.get("/attendance/stats", { params }).then((r) => r.data),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckInData) => {
      const formData = new FormData();
      formData.append("latitude", String(data.latitude));
      formData.append("longitude", String(data.longitude));
      if (data.wifiSSID) formData.append("wifiSSID", data.wifiSSID);
      if (data.mockLocation !== undefined) formData.append("mockLocation", String(data.mockLocation));
      if (data.deviceInfo) formData.append("deviceInfo", data.deviceInfo);
      return api.post("/attendance/check-in", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todayAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceHistory"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceStats"] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckOutData) => api.post("/attendance/check-out", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todayAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceHistory"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceStats"] });
    },
  });
}
