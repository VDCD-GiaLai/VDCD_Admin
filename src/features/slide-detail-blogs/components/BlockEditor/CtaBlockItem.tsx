import React, { useCallback, useMemo } from "react";
import { FormInput } from "@/components/ui";
import { useHtmlShortcuts } from "../../hooks/useHtmlShortcuts";
import {
  getCtaButtons,
  type CtaBlock,
  type CtaButtonItem,
  type CtaAlign,
  type CtaShape,
  type CtaLayout,
} from "@/types/slide-detail-blog";

interface CtaBlockItemProps {
  block: CtaBlock;
  onChange: (updated: CtaBlock) => void;
}

export function CtaBlockItem({ block, onChange }: CtaBlockItemProps) {
  const buttons = useMemo(() => getCtaButtons(block), [block]);

  const updateButtons = useCallback(
    (nextButtons: CtaButtonItem[]) => {
      const updated: CtaBlock = {
        ...block,
        items: nextButtons,
        label: nextButtons[0]?.label || "",
        url: nextButtons[0]?.url || "",
        secondaryLabel: nextButtons[1]?.label || undefined,
        secondaryUrl: nextButtons[1]?.url || undefined,
        variant: nextButtons[1]?.variant || nextButtons[0]?.variant || "solid",
      };
      if (!nextButtons[1]) {
        delete updated.secondaryLabel;
        delete updated.secondaryUrl;
      }
      onChange(updated);
    },
    [block, onChange],
  );

  const handleAddButton = useCallback(() => {
    const newBtn: CtaButtonItem = {
      id: `btn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: `Nút ${buttons.length + 1}`,
      url: "/contact",
      variant: buttons.length % 2 === 1 ? "outline" : "solid",
    };
    updateButtons([...buttons, newBtn]);
  }, [buttons, updateButtons]);

  const handleRemoveButton = useCallback(
    (idx: number) => {
      if (buttons.length <= 1) return;
      const next = buttons.filter((_, i) => i !== idx);
      updateButtons(next);
    },
    [buttons, updateButtons],
  );

  const handleMoveButton = useCallback(
    (idx: number, direction: "up" | "down") => {
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= buttons.length) return;
      const next = [...buttons];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      updateButtons(next);
    },
    [buttons, updateButtons],
  );

  const handleUpdateButton = useCallback(
    (idx: number, patch: Partial<CtaButtonItem>) => {
      const next = [...buttons];
      next[idx] = { ...next[idx], ...patch };
      updateButtons(next);
    },
    [buttons, updateButtons],
  );

  const handlePrimaryLabelChange = useCallback(
    (newValue: string) => {
      handleUpdateButton(0, { label: newValue });
    },
    [handleUpdateButton],
  );

  const { handleKeyDown } = useHtmlShortcuts(handlePrimaryLabelChange);

  const LABEL_PRESETS = [
    "Đăng ký nhu cầu đào tạo",
    "Trao đổi với trung tâm",
    "Đăng ký tư vấn ngay",
    "Tìm hiểu thêm",
    "Tư vấn giải pháp",
    "Liên hệ trực tiếp",
  ];

  const URL_PRESETS = ["/contact", "/programs", "/solutions"];

  const currentShape: CtaShape = block.shape ?? "square";
  const currentAlign: CtaAlign = block.align ?? "center";
  const currentGap = block.gap ?? (block.layout === "flex" ? 8 : 16);
  const currentLayout: CtaLayout =
    block.layout ?? (block.align === "between" ? "between" : "flex");
  const isSpaceBetween = currentLayout === "between" || currentAlign === "between";

  const getAlignClass = (align: CtaAlign) => {
    switch (align) {
      case "between":
        return "justify-between w-full";
      case "start":
        return "justify-start";
      case "end":
        return "justify-end";
      case "center":
      default:
        return "justify-center";
    }
  };

  const getButtonShapeClass = (shape: CtaShape) => {
    return shape === "pill" ? "rounded-full" : "rounded-lg";
  };

  return (
    <div className="space-y-4">
      {/* ── Bố cục & Kiểu dáng Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-muted/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Số lượng nút & Thêm nút */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text">Số nút:</span>
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {buttons.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddButton}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Thêm nút
          </button>

          {/* Kiểu dáng hình vuông / viên thuốc */}
          <span className="ml-2 text-xs font-semibold text-text">Hình dáng:</span>
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onChange({ ...block, shape: "square" })}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                currentShape === "square"
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
              title="Nút hình chữ nhật / vuông bo nhẹ"
            >
              Vuông bo nhẹ
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...block, shape: "pill" })}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                currentShape === "pill"
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
              title="Nút hình viên thuốc"
            >
              Viên thuốc (Pill)
            </button>
          </div>
        </div>

        {/* Căn lề & Bố cục */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text">Căn lề:</span>
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() =>
                onChange({ ...block, align: "center", layout: "flex" })
              }
              className={`rounded-md px-2 py-1 font-medium transition-colors ${
                currentAlign === "center" && !isSpaceBetween
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
              title="Căn giữa"
            >
              Giữa
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({ ...block, align: "start", layout: "flex" })
              }
              className={`rounded-md px-2 py-1 font-medium transition-colors ${
                currentAlign === "start" && !isSpaceBetween
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
              title="Căn trái"
            >
              Trái
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({ ...block, align: "end", layout: "flex" })
              }
              className={`rounded-md px-2 py-1 font-medium transition-colors ${
                currentAlign === "end" && !isSpaceBetween
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
              title="Căn phải"
            >
              Phải
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  layout: "between",
                  align: "between",
                })
              }
              className={`rounded-md px-2 py-1 font-medium transition-colors ${
                isSpaceBetween
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
              title="Dàn đều sang 2 bên (Space Between)"
            >
              Space Between
            </button>
          </div>

          {/* Khoảng cách giữa các nút (khi không phải Space Between) */}
          {!isSpaceBetween && (
            <>
              <span className="text-xs font-semibold text-text">Khoảng cách:</span>
              <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
                {[
                  { label: "4px", val: 4 },
                  { label: "8px", val: 8 },
                  { label: "12px", val: 12 },
                  { label: "16px", val: 16 },
                  { label: "24px", val: 24 },
                ].map((g) => (
                  <button
                    key={g.val}
                    type="button"
                    onClick={() => onChange({ ...block, gap: g.val })}
                    className={`rounded-md px-2 py-1 font-medium transition-colors ${
                      currentGap === g.val
                        ? "bg-primary text-white shadow-xs"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Danh sách nút ── */}
      <div className="space-y-3">
        {buttons.map((btn, idx) => {
          const isSolid = (btn.variant ?? (idx === 0 ? "solid" : "outline")) === "solid";

          return (
            <div
              key={btn.id || `btn_item_${idx}`}
              className="rounded-xl border border-border bg-surface p-3.5 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  Nút #{idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  {/* Variant Selector */}
                  <span className="text-[11px] text-text-muted">Kiểu:</span>
                  <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateButton(idx, { variant: "solid" })}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        isSolid
                          ? "bg-primary text-white"
                          : "text-text-muted hover:text-text"
                      }`}
                    >
                      Nền đỏ (Solid)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateButton(idx, { variant: "outline" })}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        !isSolid
                          ? "bg-primary text-white"
                          : "text-text-muted hover:text-text"
                      }`}
                    >
                      Viền đỏ (Outline)
                    </button>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="inline-flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveButton(idx, "up")}
                      className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-30"
                      title="Di chuyển lên trước"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={idx === buttons.length - 1}
                      onClick={() => handleMoveButton(idx, "down")}
                      className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-30"
                      title="Di chuyển xuống sau"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Delete button (only when > 1) */}
                  {buttons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveButton(idx)}
                      className="rounded p-1 text-danger/80 hover:bg-danger/10 hover:text-danger ml-1"
                      title="Xóa nút này"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Nhãn nút */}
                <div className="space-y-1.5">
                  <FormInput
                    label="Nhãn nút"
                    isRequired
                    placeholder={`VD: ${idx === 0 ? "Đăng ký nhu cầu đào tạo" : "Trao đổi với trung tâm"}`}
                    value={btn.label}
                    onChange={(e) => handleUpdateButton(idx, { label: e.target.value })}
                    onKeyDown={idx === 0 ? handleKeyDown : undefined}
                  />
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[11px] font-medium text-text-muted">Gợi ý:</span>
                    {LABEL_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleUpdateButton(idx, { label: preset })}
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                          btn.label === preset
                            ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                            : "border-border bg-surface text-text-muted hover:border-primary/30 hover:text-text"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* URL */}
                <div className="space-y-1.5">
                  <FormInput
                    label="Đường dẫn liên kết (URL)"
                    isRequired
                    placeholder="VD: /contact hoặc https://..."
                    value={btn.url}
                    onChange={(e) => handleUpdateButton(idx, { url: e.target.value })}
                  />
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[11px] font-medium text-text-muted">Gợi ý:</span>
                    {URL_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleUpdateButton(idx, { url: preset })}
                        className={`rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                          btn.url === preset
                            ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                            : "border-border bg-surface text-text-muted hover:border-primary/30 hover:text-text"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Realistic Editorial Live Preview with Flex-Wrap ── */}
      <div className="rounded-xl border border-border/80 bg-surface-muted/60 p-4 transition-all">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">
              Xem trước bài viết ({buttons.length} nút • {currentShape === "square" ? "Vuông bo nhẹ" : "Viên thuốc"}
              {isSpaceBetween ? " • Space Between" : ` • ${currentAlign} • gap ${currentGap}px`}):
            </span>
          </div>
          <span className="text-[11px] text-text-muted italic">
            Tự động xuống hàng (wrap) khi vượt quá chiều ngang
          </span>
        </div>

        <div className="py-4">
          <div
            className={`flex items-center flex-wrap max-w-full py-1 ${
              isSpaceBetween ? "justify-between w-full" : getAlignClass(currentAlign)
            }`}
            style={{
              gap: `${currentGap}px`,
            }}
          >
            {buttons.map((btn, index) => {
              const isOutline = btn.variant === "outline";

              return (
                <div
                  key={btn.id || index}
                  className={`group inline-flex flex-shrink-0 whitespace-nowrap items-center justify-center gap-2.5 px-6 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${getButtonShapeClass(
                    currentShape,
                  )} ${
                    isOutline
                      ? "border-2 border-primary bg-surface text-primary shadow-xs hover:bg-primary hover:text-white"
                      : "bg-gradient-to-r from-primary to-[#b82228] text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
                  }`}
                >
                  <span>{btn.label || `Nút ${index + 1}`}</span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${
                      isOutline
                        ? "bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
