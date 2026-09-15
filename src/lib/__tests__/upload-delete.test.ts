import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { deleteUploadedImage } from "../upload";
import { ApiError } from "../api-client";

vi.mock("axios");

describe("deleteUploadedImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do nothing if fileId is empty or whitespace", async () => {
    await deleteUploadedImage("");
    await deleteUploadedImage("   ");
    expect(axios.delete).not.toHaveBeenCalled();
  });

  it("should call DELETE /api/upload/:fileId with encoded fileId", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: { message: "File deleted successfully." } });

    await deleteUploadedImage("file_abc_123");

    expect(axios.delete).toHaveBeenCalledWith("/api/upload/file_abc_123");
  });

  it("should throw ApiError with backend message on axios failure", async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    vi.mocked(axios.delete).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 404,
        data: { message: "File not found on ImageKit" },
      },
    });

    await expect(deleteUploadedImage("file_invalid")).rejects.toThrow(ApiError);
  });
});
