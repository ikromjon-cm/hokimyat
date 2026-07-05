import { create } from "zustand";
import { api } from "../services/api";

interface OrganizationLocation {
  latitude: number;
  longitude: number;
}

interface OrganizationState {
  location: OrganizationLocation | null;
  wifiSSID: string | null;
  geofenceRadius: number;
  isLoading: boolean;
  fetchOrganizationDetails: (orgId: string) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  location: null,
  wifiSSID: null,
  geofenceRadius: 100,
  isLoading: false,

  fetchOrganizationDetails: async (orgId: string) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/organizations/${orgId}`);
      const org = response.data;
      set({
        location: org.latitude && org.longitude
          ? { latitude: org.latitude, longitude: org.longitude }
          : null,
        wifiSSID: org.wifiSSID || null,
        geofenceRadius: org.geofenceRadius || 100,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
