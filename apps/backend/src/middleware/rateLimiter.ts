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
  max: 3,
  message: { error: "Bir soatda 3 ta OTP dan ko'p yuborib bo'lmaydi." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
