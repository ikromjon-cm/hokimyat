import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsScreen from "../SettingsScreen";
import { api } from "../../services/api";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockUpdatePreferences = jest.fn();
jest.mock("../../store/authStore", () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: {
        fullName: "Test User",
        languagePreference: "uz",
        themePreference: "system",
      },
      updatePreferences: mockUpdatePreferences,
    }),
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders language and theme options", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("Til sozlamalari")).toBeTruthy();
    expect(getByText("Mavzu sozlamalari")).toBeTruthy();
    expect(getByText("O'zbek")).toBeTruthy();
    expect(getByText("Русский")).toBeTruthy();
  });

  it("shows active badge on selected language", () => {
    const { getAllByText } = render(<SettingsScreen />);
    const badges = getAllByText("Faol");
    expect(badges.length).toBe(2);
  });

  it("calls API and updates preference on language change", async () => {
    (api.put as jest.Mock).mockResolvedValueOnce({ data: {} });

    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("Русский"));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/users/preferences", {
        languagePreference: "ru",
        themePreference: "system",
      });
      expect(mockUpdatePreferences).toHaveBeenCalledWith({
        languagePreference: "ru",
        themePreference: "system",
      });
    });
  });

  it("navigates to TwoFactorSetup on press", () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("Ikki bosqichli autentifikatsiya"));
    expect(mockNavigate).toHaveBeenCalledWith("TwoFactorSetup");
  });

  it("navigates to SessionManagement on press", () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("Faol sessiyalar"));
    expect(mockNavigate).toHaveBeenCalledWith("SessionManagement");
  });
});
