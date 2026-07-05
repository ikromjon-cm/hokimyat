import * as Sentry from "@sentry/node";

export function initializeSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || dsn === "") {
    console.log("[Sentry] DSN not configured, skipping initialization");
    return;
  }

  let profilingIntegration: Record<string, unknown> | null = null;
  try {
    const { nodeProfilingIntegration } = require("@sentry/profiling-node");
    profilingIntegration = nodeProfilingIntegration();
  } catch {
    console.log("[Sentry] Profiling not available, skipping");
  }

  const integrations: any[] = [Sentry.httpIntegration()];
  if (profilingIntegration) integrations.push(profilingIntegration);

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    integrations,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1"),
    attachStacktrace: true,
    maxBreadcrumbs: 50,
    release: `uychi-majlis-backend@${process.env.npm_package_version || "1.0.0"}`,
    beforeSend(event) {
      if (event.exception) {
        const frames = event.exception.values?.[0]?.stacktrace?.frames;
        if (frames) {
          event.exception.values![0]!.stacktrace!.frames = frames.slice(0, 20);
        }
      }
      return event;
    },
  });

  console.log("[Sentry] Initialized");
}

export function getSentry() {
  return Sentry;
}
