import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "../services/api";

interface User {
  id: string;
  phone: string;
  fullName: string | null;
  role: string;
  languagePreference?: string;
  themePreference?: string;
  organization?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  employeeId?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => Promise<void>;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  updatePreferences: (prefs: Partial<Pick<User, "languagePreference" | "themePreference">>) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: async (user: User | null) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      await SecureStore.setItemAsync("user_data", JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync("user_data");
    }
  },

  updatePreferences: async (prefs) => {
    const user = get().user;
    if (user) {
      const updated = { ...user, ...prefs };
      set({ user: updated });
      await SecureStore.setItemAsync("user_data", JSON.stringify(updated));
    }
  },

  login: async (accessToken: string, refreshToken: string, user: User) => {
    await SecureStore.setItemAsync("access_token", accessToken);
    await SecureStore.setItemAsync("refresh_token", refreshToken);
    await SecureStore.setItemAsync("user_data", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("user_data");
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const userData = await SecureStore.getItemAsync("user_data");
      if (token && userData) {
        const user = JSON.parse(userData) as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
