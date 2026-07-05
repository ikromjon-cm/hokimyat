import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000/api/v1";
const TEST_PHONE = __ENV.TEST_PHONE || "+998901234569";

const otpRequestTrend = new Trend("otp_request_duration");
const otpVerifyTrend = new Trend("otp_verify_duration");
const attendanceTrend = new Trend("attendance_duration");
const meetingTrend = new Trend("meeting_duration");
const errorRate = new Rate("error_rate");
const successCount = new Counter("success_count");

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "2m", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "2m", target: 100 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    error_rate: ["rate<0.1"],
    otp_request_duration: ["p(95)<3000"],
    otp_verify_duration: ["p(95)<3000"],
    attendance_duration: ["p(95)<5000"],
  },
};

export default function () {
  group("Auth Flow", () => {
    const otpReqPayload = JSON.stringify({ phone: TEST_PHONE });
    const otpReqRes = http.post(`${BASE_URL}/auth/request-otp`, otpReqPayload, {
      headers: { "Content-Type": "application/json" },
    });
    otpRequestTrend.add(otpReqRes.timings.duration);
    check(otpReqRes, {
      "OTP request status 200": (r) => r.status === 200,
    }) ? successCount.add(1) : errorRate.add(1);

    const otpVerifyPayload = JSON.stringify({ phone: TEST_PHONE, code: "123456" });
    const otpVerifyRes = http.post(`${BASE_URL}/auth/verify-otp`, otpVerifyPayload, {
      headers: { "Content-Type": "application/json" },
    });
    otpVerifyTrend.add(otpVerifyRes.timings.duration);
    check(otpVerifyRes, {
      "OTP verify handled without crash": (r) => r.status >= 200 && r.status < 500,
    }) ? successCount.add(1) : errorRate.add(1);

    sleep(1);
  });

  group("Attendance Flow", () => {
    const attendancePayload = JSON.stringify({
      latitude: 41.311081,
      longitude: 69.279737,
      wifiSSID: "OFFICE_WIFI",
    });
    const attendanceRes = http.post(`${BASE_URL}/attendance/check-in`, attendancePayload, {
      headers: { "Content-Type": "application/json" },
    });
    attendanceTrend.add(attendanceRes.timings.duration);
    check(attendanceRes, {
      "Attendance handled without crash": (r) => r.status >= 200 && r.status < 500,
    }) ? successCount.add(1) : errorRate.add(1);

    sleep(2);
  });

  group("Meetings Flow", () => {
    const meetingsRes = http.get(`${BASE_URL}/meetings/my`, {
      headers: { "Content-Type": "application/json" },
    });
    meetingTrend.add(meetingsRes.timings.duration);
    check(meetingsRes, {
      "Meetings list handled without crash": (r) => r.status >= 200 && r.status < 500,
    }) ? successCount.add(1) : errorRate.add(1);

    sleep(1);
  });

  group("Health Check", () => {
    const healthRes = http.get(`${BASE_URL.replace("/api/v1", "")}/health`);
    check(healthRes, {
      "Health check returns ok": (r) => r.status === 200,
    });
  });
}
