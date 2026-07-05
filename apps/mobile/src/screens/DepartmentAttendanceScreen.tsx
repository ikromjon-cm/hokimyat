import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ThemedCard from "../components/ThemedCard";
import Badge from "../components/Badge";

export default function DepartmentAttendanceScreen() {
  const user = useAuthStore((s) => s.user);
  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: employees, isLoading } = useQuery({
    queryKey: ["departmentAttendance", user?.department?.id, selectedDate],
    queryFn: () =>
      api.get(`/attendance/department/${user?.department?.id}?date=${selectedDate}`).then((r) => r.data),
    enabled: !!user?.department?.id,
  });

  const renderItem = ({ item }: { item: any }) => (
    <ThemedCard>
      <View style={styles.employeeInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.employee?.user?.fullName || "?")[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.employeeName}>
            {item.employee?.user?.fullName || "Noma'lum"}
          </Text>
          <Text style={styles.employeeCode}>{item.employee?.employeeCode}</Text>
        </View>
      </View>

      <View style={styles.attendanceStatus}>
        {item.attendance?.checkIn ? (
          <View>
            <Text style={styles.checkInTime}>
              Kirish: {new Date(item.attendance.checkIn.timestamp).toLocaleTimeString("uz-UZ", {
                hour: "2-digit", minute: "2-digit",
              })}
            </Text>
            {item.attendance.checkIn.confidence && (
              <Badge
                label={item.attendance.checkIn.confidence === "HIGH" ? "✓ Yuqori" : "~ O'rtacha"}
                variant={item.attendance.checkIn.confidence === "HIGH" ? "success" : "warning"}
                size="sm"
              />
            )}
          </View>
        ) : (
          <Badge label="Kelmagan" variant="danger" size="sm" />
        )}
        {item.attendance?.checkOut && (
          <Text style={styles.checkOutTime}>
            Chiqish: {new Date(item.attendance.checkOut.timestamp).toLocaleTimeString("uz-UZ", {
              hour: "2-digit", minute: "2-digit",
            })}
          </Text>
        )}
      </View>
    </ThemedCard>
  );

  if (isLoading) return <LoadingSpinner fullScreen message="Ma'lumotlar yuklanmoqda..." />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user?.department?.name || "Bo'lim"} davomati</Text>
      <Text style={styles.date}>{new Date(selectedDate).toLocaleDateString("uz-UZ")}</Text>

      <FlatList
        data={employees || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.employee?.id || item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="Xodimlar topilmadi" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff", padding: 24, paddingBottom: 4 },
  date: { fontSize: 14, color: "#8899aa", paddingHorizontal: 24, paddingBottom: 16 },
  employeeInfo: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#0f3460", justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  employeeName: { color: "#fff", fontSize: 15, fontWeight: "500" },
  employeeCode: { color: "#8899aa", fontSize: 12 },
  attendanceStatus: { marginLeft: 52 },
  checkInTime: { color: "#2ecc71", fontSize: 13 },
  checkOutTime: { color: "#f39c12", fontSize: 13, marginTop: 2 },
});
