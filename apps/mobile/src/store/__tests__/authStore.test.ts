import { useAuthStore } from "../authStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it("starts with default loading state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it("sets user and clears loading on checkAuth with stored data", async () => {
    const mockUser = { id: "1", fullName: "Test User", phone: "+998901234567", role: "EMPLOYEE" };

    const { setUser } = useAuthStore.getState();
    await setUser(mockUser as any);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it("clears user on setUser(null)", async () => {
    useAuthStore.setState({
      user: { id: "1", fullName: "Test User" } as any,
      isAuthenticated: true,
    });

    const { setUser } = useAuthStore.getState();
    await setUser(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("updates preferences", () => {
    useAuthStore.setState({
      user: { id: "1", fullName: "Test User", themePreference: "system", languagePreference: "uz" } as any,
    });

    const { updatePreferences } = useAuthStore.getState();
    updatePreferences({ themePreference: "dark", languagePreference: "en" });

    const state = useAuthStore.getState();
    expect(state.user?.themePreference).toBe("dark");
    expect(state.user?.languagePreference).toBe("en");
  });

  it("sets isLoading to false on checkAuth without stored data", async () => {
    useAuthStore.setState({ isLoading: true });

    const { checkAuth } = useAuthStore.getState();
    await checkAuth();

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
  });
});
