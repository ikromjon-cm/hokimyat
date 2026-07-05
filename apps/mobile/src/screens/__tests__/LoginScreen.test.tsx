import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import LoginScreen from "../LoginScreen";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockRequestOtp = jest.fn();
jest.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ requestOtp: mockRequestOtp, isLoading: false }),
}));

jest.spyOn(Alert, "alert").mockImplementation(jest.fn());

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders phone input and submit button", () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    expect(getByPlaceholderText("+998901234567")).toBeTruthy();
    expect(getByText("Kodni olish")).toBeTruthy();
  });

  it("shows validation error for invalid phone", () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const input = getByPlaceholderText("+998901234567");

    fireEvent.changeText(input, "+99812");
    fireEvent.press(getByText("Kodni olish"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Xatolik",
      "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak",
    );
  });

  it("calls requestOtp and navigates on valid phone", async () => {
    mockRequestOtp.mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const input = getByPlaceholderText("+998901234567");
    fireEvent.changeText(input, "+998901234567");
    fireEvent.press(getByText("Kodni olish"));

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith("+998901234567");
      expect(mockNavigate).toHaveBeenCalledWith("OtpVerification", { phone: "+998901234567" });
    });
  });

  it("shows error alert on API failure", async () => {
    mockRequestOtp.mockResolvedValueOnce({ success: false, message: "Server xatosi" });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const input = getByPlaceholderText("+998901234567");
    fireEvent.changeText(input, "+998901234567");
    fireEvent.press(getByText("Kodni olish"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Xatolik", "Server xatosi");
    });
  });
});
