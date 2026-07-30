import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import axios from "axios";
import { clientFetch } from "../api-client";

// Mock axios completely
vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  
  // Create a mock function that represents an axios instance
  const mockAxiosInstance = vi.fn() as unknown as Record<string, Mock>;
  mockAxiosInstance.post = vi.fn();
  
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: actual.isAxiosError || ((payload: unknown) => (payload as Record<string, unknown>)?.isAxiosError === true),
    },
  };
});

describe("clientFetch", () => {
  let mockAxiosInstance: Record<string, Mock> & Mock;

  beforeEach(() => {
    // The mocked create method returns our instance
    mockAxiosInstance = (axios.create as Mock)();
    mockAxiosInstance.mockClear();
    mockAxiosInstance.post.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return data on success", async () => {
    const mockData = { message: "success" };
    mockAxiosInstance.mockResolvedValueOnce({
      data: { data: mockData },
    });

    const result = await clientFetch("/api/test");
    expect(result).toEqual(mockData);
    expect(mockAxiosInstance).toHaveBeenCalledWith(
      "/api/test",
      expect.any(Object)
    );
  });

  it("should throw error on API failure", async () => {
    const error = new Error("Bad Request") as Error & { isAxiosError: boolean; response: unknown };
    error.isAxiosError = true;
    error.response = {
      status: 400,
      data: { message: "Bad Request error" },
    };
    mockAxiosInstance.mockRejectedValueOnce(error);

    await expect(clientFetch("/api/test")).rejects.toThrow("Bad Request error");
  });

  it("should attempt refresh on 401 Unauthorized", async () => {
    // 1. First call fails with 401
    const authError = new Error("Unauthorized") as Error & { isAxiosError: boolean; response: unknown };
    authError.isAxiosError = true;
    authError.response = {
      status: 401,
      data: { message: "Original Unauthorized" },
    };
    mockAxiosInstance.mockRejectedValueOnce(authError);

    // 2. Refresh call succeeds
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { success: true },
    });

    // 3. Retry succeeds
    const mockData = { message: "retried success" };
    mockAxiosInstance.mockResolvedValueOnce({
      data: { data: mockData },
    });

    const result = await clientFetch("/api/test");
    
    expect(result).toEqual(mockData);
    expect(mockAxiosInstance).toHaveBeenCalledTimes(2); // Original and Retry
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1); // Refresh
    expect(mockAxiosInstance.post).toHaveBeenCalledWith("/api/auth/refresh");
  });

  it("should throw original 401 if refresh also fails", async () => {
    // 1. First call fails with 401
    const authError = new Error("Unauthorized") as Error & { isAxiosError: boolean; response: unknown };
    authError.isAxiosError = true;
    authError.response = {
      status: 401,
      data: { message: "Original Unauthorized" },
    };
    mockAxiosInstance.mockRejectedValueOnce(authError);

    // 2. Refresh call fails
    mockAxiosInstance.post.mockRejectedValueOnce(new Error("Refresh failed"));

    // Note: Since this runs in JSDOM, window.location won't actually navigate
    await expect(clientFetch("/api/test")).rejects.toThrow("Phiên đăng nhập đã hết hạn");
    
    expect(mockAxiosInstance).toHaveBeenCalledTimes(1); // Original only
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1); // Refresh
  });
});
