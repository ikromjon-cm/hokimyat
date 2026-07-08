import { useCallback, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import { getErrorMessage } from "../utils/errorHandler";

interface LoginResult {
  success: boolean;
  message?: string;
  devCode?: string;
}

export function useAuth() {
  const { isAuthenticated, user, login, logout, isLoading } = useAuthStore();
  const [authLoading, setAuthLoading] = useState(false);

  const requestOtp = useCallback(async (phone: string): Promise<LoginResult> => {
    setAuthLoading(true);
    try {
      const res = await api.post("/auth/request-otp", { phone });
      // In demo mode the backend returns the OTP code directly (no SMS sent).
      return { success: true, devCode: res.data?.devCode };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string, deviceInfo?: {
    deviceId?: string; deviceName?: string; pushToken?: string;
  }): Promise<LoginResult> => {
    setAuthLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { phone, code, ...deviceInfo });
      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setAuthLoading(false);
    }
  }, [login]);

  const logoutUser = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout errors
    }
    logout();
  }, [logout]);

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "DEPARTMENT_HEAD";

  return {
    isAuthenticated,
    user,
    isLoading: isLoading || authLoading,
    requestOtp,
    verifyOtp,
    logout: logoutUser,
    isAdmin,
  };
}
