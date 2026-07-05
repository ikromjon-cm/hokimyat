const PHONE_REGEX = /^\+998\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePhone(phone: string): string | null {
  if (!phone) return "Telefon raqam kiritilmadi";
  if (!PHONE_REGEX.test(phone)) return "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return "Email kiritilmadi";
  if (!EMAIL_REGEX.test(email)) return "Email noto'g'ri formatda";
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} kiritilishi shart`;
  return null;
}

export function validateMinLength(value: string, min: number, fieldName: string): string | null {
  if (value.length < min) return `${fieldName} kamida ${min} ta belgi bo'lishi kerak`;
  return null;
}

export function validateOTP(code: string): string | null {
  if (!code) return "Tasdiqlash kodi kiritilmadi";
  if (!/^\d{6}$/.test(code)) return "Tasdiqlash kodi 6 xonali son bo'lishi kerak";
  return null;
}

export function validateCoordinates(lat: number, lng: number): string | null {
  if (lat < -90 || lat > 90) return "Kenglik noto'g'ri";
  if (lng < -180 || lng > 180) return "Uzunlik noto'g'ri";
  return null;
}
