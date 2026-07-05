import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { otpLimiter, authLimiter } from "../middleware/rateLimiter";
import { requestOtpHandler, verifyOtpHandler, refreshTokenHandler, logoutHandler } from "../controllers/auth";

export const authRouter = Router();

/**
 * @swagger
 * /api/v1/auth/request-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Request OTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OtpRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid phone number
 *       429:
 *         description: Too many attempts
 */
authRouter.post("/request-otp", otpLimiter, requestOtpHandler);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify OTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OtpVerify'
 *     responses:
 *       200:
 *         description: Verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Invalid OTP
 */
authRouter.post("/verify-otp", verifyOtpHandler);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
authRouter.post("/refresh", refreshTokenHandler);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
authRouter.post("/logout", authenticate, logoutHandler);
