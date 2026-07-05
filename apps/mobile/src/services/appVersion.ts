import { Platform, Linking, Alert } from "react-native";
import Constants from "expo-constants";
import { api } from "./api";

interface VersionCheckResult {
  updateAvailable: boolean;
  isForceUpdate: boolean;
  latestVersion: string;
  latestBuildNumber: number;
  updateUrl: string | null;
  releaseNotes: string | null;
}

export async function checkForUpdates(): Promise<VersionCheckResult | null> {
  try {
    const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";
    const version = Constants.expoConfig?.version || "1.0.0";
    const buildNumber = Constants.expoConfig?.ios?.buildNumber
      ? parseInt(Constants.expoConfig.ios.buildNumber, 10)
      : Constants.expoConfig?.android?.versionCode || 1;

    const res = await api.get("/app/check-version", {
      params: { platform, version, buildNumber },
    });

    return res.data as VersionCheckResult;
  } catch {
    return null;
  }
}

export function promptUpdate(result: VersionCheckResult) {
  if (!result.updateAvailable) return;

  const message = result.isForceUpdate
    ? `Yangi versiya ${result.latestVersion} mavjud. Iltimos, yangilang.`
    : `Yangi versiya ${result.latestVersion} mavjud. Yangilaysizmi?`;

  Alert.alert(
    "Yangilanish mavjud",
    `${message}\n\n${result.releaseNotes || ""}`,
    result.isForceUpdate
      ? [
          {
            text: "Yangilash",
            onPress: () => {
              if (result.updateUrl) {
                Linking.openURL(result.updateUrl);
              }
            },
          },
        ]
      : [
          { text: "Keyinroq", style: "cancel" },
          {
            text: "Yangilash",
            onPress: () => {
              if (result.updateUrl) {
                Linking.openURL(result.updateUrl);
              }
            },
          },
        ]
  );
}
