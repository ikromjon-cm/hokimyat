import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ConversationsScreen from "../ConversationsScreen";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
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

describe("ConversationsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading spinner initially", () => {
    mockApi.get.mockReturnValueOnce(new Promise(() => {}));
    const { getByTestId } = renderWithQuery(<ConversationsScreen />);
    expect(getByTestId("loading-spinner")).toBeTruthy();
  });

  it("shows empty state when no conversations", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });

    const { findByTestId } = renderWithQuery(<ConversationsScreen />);

    expect(await findByTestId("empty-state")).toBeTruthy();
  });

  it("renders conversation list", async () => {
    const mockConversations = [
      {
        employeeId: "1",
        fullName: "Ali Valiyev",
        lastMessage: "Salom, majlis haqida",
        unreadCount: 2,
      },
      {
        employeeId: "2",
        fullName: "Bekzod Karimov",
        lastMessage: "Tushundim, rahmat",
        unreadCount: 0,
      },
    ];

    mockApi.get.mockResolvedValueOnce({ data: mockConversations });

    const { findByText } = renderWithQuery(<ConversationsScreen />);

    expect(await findByText("Ali Valiyev")).toBeTruthy();
    expect(await findByText("Bekzod Karimov")).toBeTruthy();
    expect(await findByText("Salom, majlis haqida")).toBeTruthy();
  });
});
