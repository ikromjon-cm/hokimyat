import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Ko'p urinishlar. Iltimos, 15 daqiqa kutib turing." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const checkInLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  message: { error: "Ko'p so'rov yuborildi. Bir daqiqada 6 martadan ko'p bo'lmang." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const meetingCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Bir soatda 10 ta uchrashuvdan ko'p yaratib bo'lmaydi." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: "Ko'p so'rov yuborildi. Iltimos, keyinroq urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  // Only FAILED requests count (skipSuccessfulRequests). Kept generous so a
  // shared office IP (many employees behind one NAT) is not locked out by a few
  // mistyped/unregistered attempts.
  max: 20,
  message: { error: "Juda ko'p urinish. Iltimos, birozdan so'ng urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
