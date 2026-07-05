import { device, element, by, expect, waitFor } from "detox";

describe("Auth Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should show login screen with phone input", async () => {
    await expect(element(by.id("phone-input"))).toBeVisible();
    await expect(element(by.id("send-otp-button"))).toBeVisible();
  });

  it("should validate phone number format", async () => {
    await element(by.id("phone-input")).typeText("12345");
    await element(by.id("send-otp-button")).tap();
    await expect(element(by.text("Telefon raqam formati noto'g'ri"))).toBeVisible();
  });

  it("should navigate to OTP screen on valid phone", async () => {
    await element(by.id("phone-input")).typeText("+998901234567");
    await element(by.id("send-otp-button")).tap();
    await waitFor(element(by.id("otp-input-0")))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id("verify-otp-button"))).toBeVisible();
  });
});
