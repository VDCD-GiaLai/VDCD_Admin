import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ToastProvider, useToast } from "../Toast";

function TestToastConsumer({
  title,
  description,
  action,
  color,
}: {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  color?: "default" | "danger" | "warning" | "success";
}) {
  const { toast } = useToast();

  return (
    <button
      type="button"
      onClick={() =>
        toast({
          title,
          description,
          action,
          color,
        })
      }
    >
      Kích hoạt Toast
    </button>
  );
}

describe("Toast with Action Button", () => {
  it("renders toast with Vietnamese action button and triggers onClick callback", () => {
    const handleActionClick = vi.fn();

    render(
      <ToastProvider>
        <TestToastConsumer
          title="Chưa chọn slide liên kết"
          description="Vui lòng chọn slide để liên kết bài viết."
          color="danger"
          action={{
            label: "Đi tới mục chọn slide",
            onClick: handleActionClick,
          }}
        />
      </ToastProvider>
    );

    // Trigger toast
    fireEvent.click(screen.getByRole("button", { name: "Kích hoạt Toast" }));

    // Verify title and description
    expect(screen.getByText("Chưa chọn slide liên kết")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng chọn slide để liên kết bài viết.")).toBeInTheDocument();

    // Verify action button and close button in Vietnamese
    const actionBtn = screen.getByRole("button", { name: "Đi tới mục chọn slide" });
    expect(actionBtn).toBeInTheDocument();
    expect(actionBtn.className).toContain("bg-danger");
    expect(screen.getAllByRole("button", { name: "Đóng" })).toHaveLength(2);

    // Click action button
    fireEvent.click(actionBtn);
    expect(handleActionClick).toHaveBeenCalledTimes(1);
  });

  it("closes toast when Đóng button is clicked", () => {
    render(
      <ToastProvider>
        <TestToastConsumer
          title="Thông báo"
          description="Nội dung kiểm tra đóng toast"
          action={{
            label: "Xem chi tiết",
            onClick: vi.fn(),
          }}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Kích hoạt Toast" }));
    expect(screen.getByText("Thông báo")).toBeInTheDocument();

    const closeButtons = screen.getAllByRole("button", { name: "Đóng" });
    fireEvent.click(closeButtons[1]); // Footer Đóng button

    expect(screen.queryByText("Thông báo")).not.toBeInTheDocument();
  });
});
