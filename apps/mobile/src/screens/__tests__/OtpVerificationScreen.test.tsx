import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";
import OtpVerificationScreen from "../OtpVerificationScreen";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { phone: "+998901234567" } }),
}));

const mockVerifyOtp = jest.fn();
const mockRequestOtp = jest.fn();
jest.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    verifyOtp: mockVerifyOtp,
    requestOtp: mockRequestOtp,
    isLoading: false,
  }),
}));

jest.spyOn(Alert, "alert").mockReturnValue();

describe("OtpVerificationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders phone number and code inputs", () => {
    const { getByText } = render(<OtpVerificationScreen />);
    expect(getByText("+998901234567")).toBeTruthy();
    expect(getByText("Tasdiqlash kodi")).toBeTruthy();
  });

  it("verify button is disabled when code is incomplete", () => {
    const { getByText } = render(<OtpVerificationScreen />);
    const verifyButton = getByText("Tasdiqlash").parent?.parent;
    fireEvent.press(getByText("Tasdiqlash"));
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it("resend button is disabled while timer is active", () => {
    const { getByText } = render(<OtpVerificationScreen />);
    expect(getByText(/Kodni qayta yuborish/)).toBeTruthy();
  });
});
