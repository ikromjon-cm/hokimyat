import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initializeSentry } from "./services/sentry";
import { AppNavigator } from "./navigation/AppNavigator";
import { useAuthStore } from "./store/authStore";
import { useOrganizationStore } from "./store/organizationStore";
import { NetworkProvider } from "./contexts/NetworkContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { processQueue } from "./services/offlineQueue";
import { useNotifications } from "./hooks/useNotifications";
import { checkForUpdates, promptUpdate } from "./services/appVersion";
import { wsService } from "./services/websocket";

initializeSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppInitializer() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const fetchOrganizationDetails = useOrganizationStore((s) => s.fetchOrganizationDetails);
  useNotifications();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.organization?.id) {
      fetchOrganizationDetails(user.organization.id);
    }
  }, [isAuthenticated, user?.organization?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      processQueue();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      wsService.connect();
      const timer = setTimeout(async () => {
        const result = await checkForUpdates();
        if (result) promptUpdate(result);
      }, 5000);
      return () => {
        clearTimeout(timer);
        wsService.disconnect();
      };
    }
  }, [isAuthenticated]);

  return <AppNavigator />;
}

function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <NetworkProvider>
              <StatusBar style="light" />
              <AppInitializer />
            </NetworkProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default App;
