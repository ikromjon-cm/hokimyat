import React, { useState } from "react";
import {
  View, Text, StyleSheet, Alert, Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { addToQueue } from "../services/offlineQueue";
import { parseApiError } from "../services/errorHandler";
import ThemedButton from "../components/ThemedButton";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CheckOutScreen() {
  const navigation = useNavigation();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const checkOutMutation = useMutation({
    mutationFn: async (data: { latitude?: number; longitude?: number }) => {
      const response = await api.post("/attendance/check-out", {
        ...data,
        deviceInfo: JSON.stringify({ platform: Platform.OS }),
      });
      return response.data;
    },
    onSuccess: () => {
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert("Xatolik", parseApiError(error).message);
    },
  });

  const handleCheckOut = async () => {
    setIsGettingLocation(true);
    try {
      const isConnected = (await Network.getNetworkStateAsync()).isConnected ?? false;

      if (!isConnected) {
        const fallback = await Location.getLastKnownPositionAsync();
        await addToQueue({
          type: "CHECK_OUT",
          data: {
            latitude: fallback?.coords.latitude,
            longitude: fallback?.coords.longitude,
            deviceInfo: JSON.stringify({ platform: Platform.OS }),
          },
        });
        navigation.goBack();
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      checkOutMutation.mutate({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      checkOutMutation.mutate({});
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chiqishni qayd etish</Text>
      <Text style={styles.subtitle}>
        Ish kunini yakunlash uchun "Ketdim" tugmasini bosing
      </Text>

      <ThemedButton
        title="Ketdim"
        onPress={handleCheckOut}
        loading={checkOutMutation.isPending || isGettingLocation}
        fullWidth
        variant="secondary"
        size="lg"
      />

      {isGettingLocation && <LoadingSpinner message="Joylashuv aniqlanmoqda..." />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#8899aa", textAlign: "center", marginBottom: 32, lineHeight: 20 },
});
