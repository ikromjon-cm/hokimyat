import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_TOKEN_KEY = "biometric_refresh_token";

export async function isBiometricAvailable(): Promise<{
  available: boolean;
  type: "fingerprint" | "facial" | "iris" | null;
}> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return { available: false, type: null };

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return { available: false, type: null };

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  let type: "fingerprint" | "facial" | "iris" | null = null;
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    type = "fingerprint";
  } else if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    type = "facial";
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    type = "iris";
  }

  return { available: true, type };
}

export async function saveBiometricToken(refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, refreshToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getBiometricToken(): Promise<string | null> {
  return SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
}

export async function clearBiometricToken(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
}

export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Biometrik autentifikatsiya",
      fallbackLabel: "PIN kodni ishlatish",
      cancelLabel: "Bekor qilish",
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return { success: false, error: getBiometricErrorMessage(result.error) };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function getBiometricErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "user_cancel": "Foydalanuvchi bekor qildi",
    "system_cancel": "Tizim tomonidan bekor qilindi",
    "app_cancel": "Ilova tomonidan bekor qilindi",
    "not_enrolled": "Biometrik ma'lumotlar ro'yxatdan o'tkazilmagan",
    "not_available": "Biometrik autentifikatsiya mavjud emas",
    "lockout": "Biometrik autentifikatsiya bloklangan",
    "lockout_permanent": "Biometrik autentifikatsiya doimiy bloklangan",
    "passcode_not_set": "PIN kod o'rnatilmagan",
    "authentication_failed": "Autentifikatsiya muvaffaqiyatsiz",
  };
  return messages[code] || "Biometrik autentifikatsiya xatosi";
}
