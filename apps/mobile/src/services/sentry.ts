import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const dsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initializeSentry() {
  if (!dsn || dsn === "") {
    console.log("[Sentry] DSN not configured, skipping mobile initialization");
    return;
  }

  Sentry.init({
    dsn,
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    profilesSampleRate: __DEV__ ? 0.0 : 0.1,
    attachStacktrace: true,
    maxBreadcrumbs: 50,
    enableNative: true,
    beforeSend(event) {
      if (event.exception?.values) {
        const frames = event.exception.values[0]?.stacktrace?.frames;
        if (frames) {
          event.exception.values[0]!.stacktrace!.frames = frames.slice(0, 30);
        }
      }
      return event;
    },
  });

  console.log("[Sentry] Mobile initialized");
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (!dsn) {
    console.error("[Sentry] Error captured (DSN not configured):", error, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: "fatal" | "error" | "warning" | "log" | "info" | "debug" = "info") {
  if (!dsn) return;
  Sentry.captureMessage(message, level);
}

export default Sentry;
