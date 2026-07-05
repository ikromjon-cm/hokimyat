import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api";

export function useDownloadAttendanceCertificate(employeeId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get(`/documents/attendance-certificate/${employeeId}`, {
        responseType: "blob",
      });
      return res.data;
    },
  });
}

export function useDownloadMeetingMinutes(meetingId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get(`/documents/meeting-minutes/${meetingId}`, {
        responseType: "blob",
      });
      return res.data;
    },
  });
}

export function useCreateOrderDocument() {
  return useMutation({
    mutationFn: async (data: {
      title: string; content: string; orderNumber: string; date: string;
    }) => {
      const res = await api.post("/documents/order", data, {
        responseType: "blob",
      });
      return res.data;
    },
  });
}
