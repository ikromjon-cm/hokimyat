import { AxiosError } from "axios";
import { parseApiError, isNetworkError, isAuthError } from "../errorHandler";

describe("parseApiError", () => {
  it("returns network error when no response", () => {
    const axiosError = new AxiosError("Network Error", "ERR_NETWORK");
    const result = parseApiError(axiosError);
    expect(result.code).toBe("NETWORK_ERROR");
    expect(result.message).toContain("Tarmoq aloqasi yo'q");
  });

  it("parses server error response", () => {
    const axiosError = new AxiosError("Not Found", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 404,
      data: { error: { message: "Xodim topilmadi", code: "NOT_FOUND" } },
    } as any);
    const result = parseApiError(axiosError);
    expect(result.message).toBe("Xodim topilmadi");
    expect(result.code).toBe("NOT_FOUND");
  });

  it("returns status-based message when no error body", () => {
    const axiosError = new AxiosError("Too Many", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 429,
      data: {},
    } as any);
    const result = parseApiError(axiosError);
    expect(result.message).toBe("Ko'p so'rov yuborildi");
  });

  it("handles standard Error objects", () => {
    const error = new Error("Test error");
    const result = parseApiError(error);
    expect(result.code).toBe("INTERNAL");
    expect(result.message).toBe("Test error");
  });

  it("handles unknown error types", () => {
    const result = parseApiError("string error");
    expect(result.code).toBe("UNKNOWN");
  });
});

describe("isNetworkError", () => {
  it("returns true for network errors", () => {
    const axiosError = new AxiosError("Network Error", "ERR_NETWORK");
    expect(isNetworkError(axiosError)).toBe(true);
  });

  it("returns false for HTTP errors", () => {
    const axiosError = new AxiosError("Not Found", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 404,
      data: {},
    } as any);
    expect(isNetworkError(axiosError)).toBe(false);
  });
});

describe("isAuthError", () => {
  it("returns true for 401 errors", () => {
    const axiosError = new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 401,
      data: {},
    } as any);
    expect(isAuthError(axiosError)).toBe(true);
  });

  it("returns false for other errors", () => {
    const axiosError = new AxiosError("Not Found", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 404,
      data: {},
    } as any);
    expect(isAuthError(axiosError)).toBe(false);
  });
});
