import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomeScreen from "../HomeScreen";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockUser = {
  fullName: "Ali Valiyev",
  role: "EMPLOYEE",
};
let mockAuthSelector = (fn: any) => fn({ user: mockUser });

jest.mock("../../store/authStore", () => ({
  useAuthStore: (selector: any) => mockAuthSelector(selector),
}));

jest.mock("../../services/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApi = jest.requireMock("../../services/api").api;

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthSelector = (fn: any) => fn({ user: mockUser });
  });

  it("renders greeting with user name", () => {
    mockApi.get.mockResolvedValue({ data: [] });
    mockApi.get.mockResolvedValue({ data: { presentDays: 5, lateDays: 1, attendanceRate: 83 } });

    const { getByText } = renderWithQuery(<HomeScreen />);
    expect(getByText("Ali Valiyev")).toBeTruthy();
    expect(getByText("Assalomu alaykum")).toBeTruthy();
  });

  it("renders admin panel for SUPER_ADMIN", () => {
    mockAuthSelector = (fn: any) =>
      fn({ user: { fullName: "Admin", role: "SUPER_ADMIN" } });
    mockApi.get.mockResolvedValue({ data: [] });
    mockApi.get.mockResolvedValue({ data: {} });

    const { getByText } = renderWithQuery(<HomeScreen />);
    expect(getByText("Administrator paneli")).toBeTruthy();
  });

  it("shows check-in button when not checked in", async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    mockApi.get.mockResolvedValue({ data: {} });

    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText("Keldim")).toBeTruthy();
  });

  it("shows completed message when checked in and out", async () => {
    mockApi.get.mockResolvedValue({ data: [{ type: "CHECK_IN" }, { type: "CHECK_OUT" }] });
    mockApi.get.mockResolvedValue({ data: {} });

    const { findByText } = renderWithQuery(<HomeScreen />);
    expect(await findByText("Bugungi davomat to'liq qayd etildi")).toBeTruthy();
  });
});
