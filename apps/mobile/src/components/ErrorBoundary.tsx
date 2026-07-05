import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { captureError } from "../services/sentry";
import ThemedButton from "./ThemedButton";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureError(error, { componentStack: errorInfo.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.title}>Xatolik yuz berdi</Text>
          <Text style={styles.message}>
            {this.state.error?.message || "Kutilmagan xatolik"}
          </Text>
          <ThemedButton
            title="Qayta urinish"
            onPress={this.handleRetry}
            variant="primary"
            fullWidth
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  icon: {
    fontSize: 48, fontWeight: "bold", color: "#e74c3c",
    width: 80, height: 80, textAlign: "center", lineHeight: 80,
    borderRadius: 40, backgroundColor: "#3d2020", overflow: "hidden", marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  message: { fontSize: 14, color: "#8899aa", textAlign: "center", marginBottom: 24 },
});
