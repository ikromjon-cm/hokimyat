import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useTwoFactorStatus() {
  return useQuery({
    queryKey: ["twoFactorStatus"],
    queryFn: () => api.get("/two-factor/status").then((r) => r.data),
  });
}

export function useEnableTwoFactor() {
  return useMutation({
    mutationFn: () => api.post("/two-factor/enable").then((r) => r.data),
  });
}

export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.post("/two-factor/verify", { token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorStatus"] });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/two-factor/disable"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorStatus"] });
    },
  });
}
