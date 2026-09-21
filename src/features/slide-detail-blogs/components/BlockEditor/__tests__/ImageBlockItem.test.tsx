import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageBlockItem } from "../ImageBlockItem";
import { ImageBlockRenderer } from "../../BlogPreview/renderers/ImageBlockRenderer";
import type { ImageBlock } from "@/types/slide-detail-blog";

vi.mock("@/components/shared", () => ({
  ImagePickerModal: ({
    isOpen,
    onSelect,
    onClose,
  }: {
    isOpen: boolean;
    onSelect: (image: { url: string; fileId?: string }) => void;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-image-picker-modal">
        <button
          onClick={() =>
            onSelect({
              url: "https://ik.imagekit.io/vdcd/selected-from-gallery.jpg",
              fileId: "file_gal_999",
            })
          }
        >
          Xác nhận chọn ảnh
        </button>
        <button onClick={onClose}>Đóng modal</button>
      </div>
    );
  },
}));

vi.mock("@/components/ui", () => ({
  FormInput: ({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) => (
    <div>
      <label>{label}</label>
      <input
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
      />
    </div>
  ),
  Spinner: () => <div>Loading...</div>,
  useToast: () => ({ toast: vi.fn() }),
}));

const emptyBlock: ImageBlock = {
  id: "img_test_1",
  type: "image",
  url: "",
  fileId: null,
  alt: "",
  caption: null,
};

const filledBlock: ImageBlock = {
  id: "img_test_2",
  type: "image",
  url: "https://ik.imagekit.io/vdcd/existing.jpg",
  fileId: "file_old_111",
  alt: "Ảnh minh hoạ",
  caption: "Chú thích ảnh",
};

describe("ImageBlockItem (Tab Nội dung - BlockEditor)", () => {
  it("renders 'Chọn từ thư viện' button in upload mode", () => {
    const onChange = vi.fn();
    render(<ImageBlockItem block={emptyBlock} onChange={onChange} />);

    // Expect 'Chọn từ thư viện' buttons (one in the control bar, one inside empty placeholder)
    const galleryBtns = screen.getAllByRole("button", { name: /Chọn từ thư viện/i });
    expect(galleryBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("opens ImagePickerModal when 'Chọn từ thư viện' is clicked and updates block on select", () => {
    const onChange = vi.fn();
    render(<ImageBlockItem block={emptyBlock} onChange={onChange} />);

    expect(screen.queryByTestId("mock-image-picker-modal")).not.toBeInTheDocument();

    const [galleryBtn] = screen.getAllByRole("button", { name: /Chọn từ thư viện/i });
    fireEvent.click(galleryBtn);

    expect(screen.getByTestId("mock-image-picker-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Xác nhận chọn ảnh"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://ik.imagekit.io/vdcd/selected-from-gallery.jpg",
        fileId: null,
      }),
    );
    expect(screen.queryByTestId("mock-image-picker-modal")).not.toBeInTheDocument();
  });
});

describe("ImageBlockRenderer (Tab Chỉnh sửa trực quan - Canvas)", () => {
  it("renders 'Chọn từ thư viện' button when block has no image in editable mode", () => {
    render(<ImageBlockRenderer block={emptyBlock} editable={true} />);

    expect(screen.getByRole("button", { name: /Chọn từ thư viện/i })).toBeInTheDocument();
  });

  it("opens modal and calls onImageUpdate when selecting from gallery on Canvas", () => {
    const onImageUpdate = vi.fn();
    render(
      <ImageBlockRenderer
        block={emptyBlock}
        editable={true}
        onImageUpdate={onImageUpdate}
      />,
    );

    const galleryBtn = screen.getByRole("button", { name: /Chọn từ thư viện/i });
    fireEvent.click(galleryBtn);

    expect(screen.getByTestId("mock-image-picker-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Xác nhận chọn ảnh"));

    expect(onImageUpdate).toHaveBeenCalledWith(
      "https://ik.imagekit.io/vdcd/selected-from-gallery.jpg",
      null,
    );
  });

  it("renders 'Chọn từ thư viện' on hover overlay when image already exists", () => {
    render(<ImageBlockRenderer block={filledBlock} editable={true} />);

    const btns = screen.getAllByRole("button", { name: /Chọn từ thư viện/i });
    expect(btns.length).toBeGreaterThanOrEqual(1);
  });
});
