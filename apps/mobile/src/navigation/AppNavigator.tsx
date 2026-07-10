import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import NetworkBanner from "../components/NetworkBanner";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeProvider";
import { RootStackParamList, MainTabParamList } from "./types";
import linking from "./linking";
import { captureError } from "../services/sentry";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

import LoginScreen from "../screens/LoginScreen";
import OtpVerificationScreen from "../screens/OtpVerificationScreen";
import HomeScreen from "../screens/HomeScreen";
import CheckInScreen from "../screens/CheckInScreen";
import CheckOutScreen from "../screens/CheckOutScreen";
import MeetingsScreen from "../screens/MeetingsScreen";
import MeetingDetailScreen from "../screens/MeetingDetailScreen";
import AttendanceHistoryScreen from "../screens/AttendanceHistoryScreen";
import StatisticsScreen from "../screens/StatisticsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import DepartmentAttendanceScreen from "../screens/DepartmentAttendanceScreen";
import CreateMeetingScreen from "../screens/CreateMeetingScreen";
import DepartmentReportsScreen from "../screens/DepartmentReportsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import TwoFactorSetupScreen from "../screens/TwoFactorSetupScreen";
import SessionManagementScreen from "../screens/SessionManagementScreen";
import ConversationsScreen from "../screens/ConversationsScreen";
import ChatMessagesScreen from "../screens/ChatMessagesScreen";
import DocumentsScreen from "../screens/DocumentsScreen";
import FaceVerificationScreen from "../screens/FaceVerificationScreen";
import QRScannerScreen from "../screens/QRScannerScreen";
import EmployeeDirectoryScreen from "../screens/EmployeeDirectoryScreen";
import CreateOrderScreen from "../screens/CreateOrderScreen";
import EmployeesRegistryScreen from "../screens/admin/EmployeesRegistryScreen";
import OrganizationsManagementScreen from "../screens/admin/OrganizationsManagementScreen";
import AuditLogsScreen from "../screens/admin/AuditLogsScreen";
import ReportsCenterScreen from "../screens/admin/ReportsCenterScreen";
import SuspiciousActivitiesScreen from "../screens/admin/SuspiciousActivitiesScreen";
import SystemSettingsScreen from "../screens/admin/SystemSettingsScreen";
import OrganizationSettingsScreen from "../screens/admin/OrganizationSettingsScreen";
import MeetingMonitoringDashboardScreen from "../screens/admin/MeetingMonitoringDashboardScreen";
import CreateGlobalMeetingScreen from "../screens/admin/CreateGlobalMeetingScreen";

const tabIcon = (name: string) =>
  function TabIcon({ color }: { color: string }) {
    return <FontAwesome5 name={name} size={19} color={color} />;
  };

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Bosh sahifa", tabBarIcon: tabIcon("home") }} />
      <Tab.Screen name="Meetings" component={MeetingsScreen} options={{ tabBarLabel: "Uchrashuvlar", tabBarIcon: tabIcon("calendar-alt") }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: "Bildirishnoma", tabBarIcon: tabIcon("bell") }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "Profil", tabBarIcon: tabIcon("user") }} />
    </Tab.Navigator>
  );
}

function useNotificationNavigation() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isAuthenticated) return;

      const data = response.notification.request.content.data;
      if (!data) return;

      try {
        if (data.type === "meeting" && data.meetingId) {
          navigationRef.current?.navigate("MeetingDetail", { meetingId: data.meetingId as string });
        } else if (data.type === "attendance") {
          navigationRef.current?.navigate("AttendanceHistory");
        } else if (data.type === "report") {
          navigationRef.current?.navigate("DepartmentReports");
        } else if (data.type === "check-in") {
          navigationRef.current?.navigate("CheckIn");
        }
      } catch (err) {
        captureError(err as Error, { context: "notification_deep_link" });
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  return navigationRef;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1a1a2e" },
});

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { colors } = useTheme();
  const navigationRef = useNotificationNavigation();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <NetworkBanner />
        <NavigationContainer ref={navigationRef} linking={linking}>
            <Stack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: { fontWeight: "600" },
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              {!isAuthenticated ? (
                <>
                  <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} options={{ headerShown: false }} />
                </>
              ) : (
                <>
                  <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
                  <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: "Kirish" }} />
                  <Stack.Screen name="CheckOut" component={CheckOutScreen} options={{ title: "Chiqish" }} />
                  <Stack.Screen name="MeetingDetail" component={MeetingDetailScreen} options={{ title: "Uchrashuv" }} />
                  <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: "Davomat tarixi" }} />
                  <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: "Statistika" }} />
                  <Stack.Screen name="DepartmentAttendance" component={DepartmentAttendanceScreen} options={{ title: "Bo'lim davomati" }} />
                  <Stack.Screen name="CreateMeeting" component={CreateMeetingScreen} options={{ title: "Uchrashuv yaratish" }} />
                  <Stack.Screen name="DepartmentReports" component={DepartmentReportsScreen} options={{ title: "Hisobotlar" }} />
                  <Stack.Screen name="EmployeesRegistry" component={EmployeesRegistryScreen} options={{ title: "Xodimlar reestri" }} />
                  <Stack.Screen name="OrganizationsManagement" component={OrganizationsManagementScreen} options={{ title: "Tashkilotlar" }} />
                  <Stack.Screen name="AuditLogs" component={AuditLogsScreen} options={{ title: "Audit jurnali" }} />
                  <Stack.Screen name="ReportsCenter" component={ReportsCenterScreen} options={{ title: "Hisobotlar" }} />
                  <Stack.Screen name="SuspiciousActivities" component={SuspiciousActivitiesScreen} options={{ title: "Shubhali faoliyat" }} />
                  <Stack.Screen name="OrganizationSettings" component={OrganizationSettingsScreen} options={{ title: "Tashkilot sozlamalari" }} />
                  <Stack.Screen name="MeetingMonitoringDashboard" component={MeetingMonitoringDashboardScreen} options={{ title: "Uchrashuvlar monitoringi" }} />
                  <Stack.Screen name="CreateGlobalMeeting" component={CreateGlobalMeetingScreen} options={{ title: "Global uchrashuv" }} />
                  <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} options={{ title: "Tizim sozlamalari" }} />
                  <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Sozlamalar" }} />
                  <Stack.Screen name="TwoFactorSetup" component={TwoFactorSetupScreen} options={{ title: "2FA" }} />
                  <Stack.Screen name="SessionManagement" component={SessionManagementScreen} options={{ title: "Sessiyalar" }} />
                  <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: "Xabarlar" }} />
                  <Stack.Screen name="ChatMessages" component={ChatMessagesScreen} options={{ title: "Chat" }} />
                  <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: "Hujjatlar" }} />
                  <Stack.Screen name="FaceVerification" component={FaceVerificationScreen} options={{ title: "Yuz tekshirish" }} />
                  <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="EmployeeDirectory" component={EmployeeDirectoryScreen} options={{ title: "Xodimlar" }} />
                  <Stack.Screen name="CreateOrder" component={CreateOrderScreen} options={{ title: "Buyruq yaratish" }} />
                </>
              )}
            </Stack.Navigator>
        </NavigationContainer>
      </View>
    </ErrorBoundary>
  );
}
