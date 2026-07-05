import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

interface CreateMeetingData {
  title: string;
  agenda?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  participantIds: string[];
}

export function useMyMeetings() {
  return useQuery({
    queryKey: ["myMeetings"],
    queryFn: () => api.get("/meetings/my").then((r) => r.data),
  });
}

export function usePendingMeetings() {
  return useQuery({
    queryKey: ["pendingMeetings"],
    queryFn: () => api.get("/meetings/pending").then((r) => r.data),
  });
}

export function useMeetingDetail(meetingId: string) {
  return useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () => api.get(`/meetings/${meetingId}`).then((r) => r.data),
    enabled: !!meetingId,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMeetingData) => api.post("/meetings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMeetings"] });
    },
  });
}

export function useConfirmMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => api.post(`/meetings/${meetingId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMeetings"] });
      queryClient.invalidateQueries({ queryKey: ["pendingMeetings"] });
    },
  });
}

export function useCancelMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => api.post(`/meetings/${meetingId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMeetings"] });
    },
  });
}

export function useScanMeetingQR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (qrData: string) => api.post("/meetings/scan-qr", { qrData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMeetings"] });
    },
  });
}
