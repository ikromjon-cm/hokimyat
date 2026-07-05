import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as Network from "expo-network";
import { View, Text, StyleSheet } from "react-native";

interface NetworkContextType {
  isConnected: boolean;
}

const NetworkContext = createContext<NetworkContextType>({ isConnected: true });

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsConnected(state.isConnected ?? false);
      } catch {
        setIsConnected(false);
      }
    };

    check();
    interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {!isConnected && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Internet aloqasi mavjud emas
          </Text>
        </View>
      )}
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#e74c3c",
    padding: 8,
    alignItems: "center",
    zIndex: 9999,
  },
  bannerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
});
