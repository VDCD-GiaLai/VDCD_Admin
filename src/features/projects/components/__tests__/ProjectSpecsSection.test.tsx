import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectHeaderBadges } from "../ProjectHeaderBadges";
import { ProjectSpecsSection } from "../ProjectSpecsSection";

describe("ProjectHeaderBadges Component", () => {
  it("renders field, province, and year badges correctly", () => {
    render(
      <ProjectHeaderBadges
        fieldName="Nông nghiệp công nghệ cao"
        provinceName="Đắk Lắk"
        year={2025}
      />,
    );

    expect(screen.getByText("Nông nghiệp công nghệ cao")).toBeInTheDocument();
    expect(screen.getByText("📍 Đắk Lắk")).toBeInTheDocument();
    expect(screen.getByText("🗓️ 2025")).toBeInTheDocument();
  });

  it("returns null when no metadata props provided", () => {
    const { container } = render(<ProjectHeaderBadges />);
    expect(container.firstChild).toBeNull();
  });
});

describe("ProjectSpecsSection Component", () => {
  const sampleHighlights = [
    { label: "Công nghệ", value: "AutoTimelapse 4K" },
    { label: "Chủ đầu tư", value: "Tập đoàn Vingroup" },
  ];

  const sampleProvinces = [
    { id: "prov-1", name: "Đà Nẵng" },
    { id: "prov-2", name: "Hà Nội" },
  ];

  it("renders complete 3 overview cards, services tags, and technical highlights", () => {
    render(
      <ProjectSpecsSection
        discipline="Giám sát công trình"
        provinceName="Hà Nội"
        year={2024}
        services={["AutoTimelapse đa góc", "Báo cáo tiến độ tự động"]}
        technicalHighlights={sampleHighlights}
        interactive={false}
      />,
    );

    // Section title
    expect(screen.getByText("THÔNG SỐ DỰ ÁN & DỊCH VỤ")).toBeInTheDocument();

    // Overview cards
    expect(screen.getByText("Giám sát công trình")).toBeInTheDocument();
    expect(screen.getByText("Hà Nội")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();

    // Services
    expect(screen.getByText("✓ AutoTimelapse đa góc")).toBeInTheDocument();
    expect(screen.getByText("✓ Báo cáo tiến độ tự động")).toBeInTheDocument();

    // Technical highlights with red text values
    expect(screen.getByText("Công nghệ")).toBeInTheDocument();
    expect(screen.getByText("AutoTimelapse 4K")).toBeInTheDocument();
    expect(screen.getByText("Chủ đầu tư")).toBeInTheDocument();
    expect(screen.getByText("Tập đoàn Vingroup")).toBeInTheDocument();

    // Ensure NO edit button in read-only mode
    expect(screen.queryByRole("button", { name: /Sửa thông số/i })).not.toBeInTheDocument();
  });

  it("renders interactive mode with quick-edit button and triggers callback", () => {
    const mockOnEdit = vi.fn();

    render(
      <ProjectSpecsSection
        discipline="Trắc địa & Đo đạc"
        provinceName="TP. Hồ Chí Minh"
        year={2026}
        interactive={true}
        onEditClick={mockOnEdit}
      />,
    );

    const editButton = screen.getByRole("button", { name: /Sửa thông số/i });
    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);

    // After click, toggles to Hoàn tất
    expect(screen.getByRole("button", { name: /Hoàn tất/i })).toBeInTheDocument();
  });

  it("handles missing/empty values gracefully in interactive mode", () => {
    render(<ProjectSpecsSection interactive={true} />);

    expect(screen.getByText("(Chưa nhập)")).toBeInTheDocument();
    expect(screen.getByText("(Chưa chọn tỉnh thành)")).toBeInTheDocument();
    expect(screen.getByText("(Chưa nhập năm)")).toBeInTheDocument();
    expect(
      screen.getByText(/Chưa có dịch vụ cung cấp/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Chưa có điểm nhấn kỹ thuật/i),
    ).toBeInTheDocument();
  });

  it("allows direct inline editing of discipline, province, and year", () => {
    const handleDisciplineChange = vi.fn();
    const handleProvinceChange = vi.fn();
    const handleYearChange = vi.fn();

    render(
      <ProjectSpecsSection
        discipline="Khảo sát địa hình"
        provinceId="prov-1"
        provinceName="Đà Nẵng"
        provinces={sampleProvinces}
        year={2025}
        interactive={true}
        onDisciplineChange={handleDisciplineChange}
        onProvinceChange={handleProvinceChange}
        onYearChange={handleYearChange}
      />,
    );

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /Sửa thông số/i }));

    // Discipline input
    const disciplineInput = screen.getByPlaceholderText("VD: Trắc địa & Quy hoạch");
    expect(disciplineInput).toHaveValue("Khảo sát địa hình");
    fireEvent.change(disciplineInput, { target: { value: "Trắc địa & Quy hoạch" } });
    expect(handleDisciplineChange).toHaveBeenCalledWith("Trắc địa & Quy hoạch");

    // Province select
    const provinceSelect = screen.getByDisplayValue("Đà Nẵng");
    fireEvent.change(provinceSelect, { target: { value: "prov-2" } });
    expect(handleProvinceChange).toHaveBeenCalledWith("prov-2");

    // Year input
    const yearInput = screen.getByPlaceholderText("2025");
    fireEvent.change(yearInput, { target: { value: "2027" } });
    expect(handleYearChange).toHaveBeenCalledWith(2027);
  });

  it("allows direct inline adding and deleting of services", () => {
    const handleServicesChange = vi.fn();

    render(
      <ProjectSpecsSection
        services={["Bản vẽ 2D", "Mô hình 3D"]}
        interactive={true}
        onServicesChange={handleServicesChange}
      />,
    );

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /Sửa thông số/i }));

    // Delete a service
    const deleteBtn = screen.getByRole("button", { name: /Xoá dịch vụ Bản vẽ 2D/i });
    fireEvent.click(deleteBtn);
    expect(handleServicesChange).toHaveBeenCalledWith(["Mô hình 3D"]);

    // Add a service via input and button
    const serviceInput = screen.getByPlaceholderText("+ Thêm dịch vụ...");
    fireEvent.change(serviceInput, { target: { value: "Drone RTK" } });
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }));
    expect(handleServicesChange).toHaveBeenCalledWith(["Bản vẽ 2D", "Mô hình 3D", "Drone RTK"]);

    // Add a service via Enter key
    fireEvent.change(serviceInput, { target: { value: "Khảo sát LiDAR" } });
    fireEvent.keyDown(serviceInput, { key: "Enter", code: "Enter" });
    expect(handleServicesChange).toHaveBeenCalledWith(["Bản vẽ 2D", "Mô hình 3D", "Khảo sát LiDAR"]);
  });

  it("allows direct inline adding, updating, and deleting of technical highlights", () => {
    const handleHighlightsChange = vi.fn();

    render(
      <ProjectSpecsSection
        technicalHighlights={sampleHighlights}
        interactive={true}
        onHighlightsChange={handleHighlightsChange}
      />,
    );

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /Sửa thông số/i }));

    // Edit label of first highlight
    const labelInputs = screen.getAllByPlaceholderText("VD: Diện tích");
    fireEvent.change(labelInputs[0], { target: { value: "Công nghệ chính" } });
    expect(handleHighlightsChange).toHaveBeenCalledWith([
      { label: "Công nghệ chính", value: "AutoTimelapse 4K" },
      { label: "Chủ đầu tư", value: "Tập đoàn Vingroup" },
    ]);

    // Edit value of first highlight
    const valueInputs = screen.getAllByPlaceholderText("VD: 4,439 ha");
    fireEvent.change(valueInputs[0], { target: { value: "AutoTimelapse 8K" } });
    expect(handleHighlightsChange).toHaveBeenCalledWith([
      { label: "Công nghệ", value: "AutoTimelapse 8K" },
      { label: "Chủ đầu tư", value: "Tập đoàn Vingroup" },
    ]);

    // Delete second highlight
    const deleteHighlightBtns = screen.getAllByTitle("Xoá điểm nhấn này");
    fireEvent.click(deleteHighlightBtns[1]);
    expect(handleHighlightsChange).toHaveBeenCalledWith([
      { label: "Công nghệ", value: "AutoTimelapse 4K" },
    ]);

    // Add a new technical highlight
    const addHighlightBtn = screen.getByText("Thêm điểm nhấn kỹ thuật");
    fireEvent.click(addHighlightBtn);
    expect(handleHighlightsChange).toHaveBeenCalledWith([
      ...sampleHighlights,
      { label: "", value: "" },
    ]);
  });
});
