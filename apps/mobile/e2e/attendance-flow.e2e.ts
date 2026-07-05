import { device, element, by, expect, waitFor } from "detox";

describe("Attendance Flow", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, permissions: { location: "always", camera: "yes" } });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should show map and check-in button on home screen", async () => {
    await expect(element(by.id("home-screen"))).toBeVisible();
    await expect(element(by.id("check-in-button"))).toBeVisible();
  });

  it("should navigate to check-in screen", async () => {
    await element(by.id("check-in-button")).tap();
    await waitFor(element(by.id("check-in-screen")))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should show geofence status on check-in screen", async () => {
    await element(by.id("check-in-button")).tap();
    await waitFor(element(by.id("geofence-status")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should show selfie camera on check-in screen", async () => {
    await element(by.id("check-in-button")).tap();
    await waitFor(element(by.id("selfie-camera")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should complete check-in flow", async () => {
    await element(by.id("check-in-button")).tap();
    await waitFor(element(by.id("selfie-camera")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("capture-selfie-button")).tap();
    await waitFor(element(by.id("confirm-check-in-button")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id("confirm-check-in-button")).tap();
    await waitFor(element(by.text("Kelish belgilandi")))
      .toBeVisible()
      .withTimeout(10000);
  });
});
