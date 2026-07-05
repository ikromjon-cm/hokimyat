import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get("/messages/conversations").then((r) => r.data),
  });
}

export function useMessages(employeeId: string) {
  return useQuery({
    queryKey: ["messages", employeeId],
    queryFn: () => api.get(`/messages/${employeeId}`).then((r) => r.data),
    enabled: !!employeeId,
    refetchInterval: 10000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: () => api.get("/messages/unread").then((r) => r.data),
    refetchInterval: 15000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { receiverEmployeeId: string; content: string }) =>
      api.post("/messages", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.receiverEmployeeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}
