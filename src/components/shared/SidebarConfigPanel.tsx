"use client";

import { useState } from "react";
import { DropdownSelect, FormInput } from "@/components/ui";
import type {
  SidebarConfig,
  SidebarWidgetConfig,
  SidebarWidgetType,
  SidebarCtaConfig,
} from "@/types/sidebar-config";

/* ── Widget type metadata ── */

const WIDGET_TYPE_OPTIONS: { value: SidebarWidgetType; label: string }[] = [
  { value: "solutions", label: "Giải pháp" },
  { value: "articles", label: "Tin tức / Bài viết" },
  { value: "programs", label: "Chương trình / Hoạt động" },
  { value: "projects", label: "Dự án" },
];

interface EntityItem {
  id: string;
  slug?: string;
  title: string;
}

interface SidebarConfigPanelProps {
  /** Current sidebar config value */
  value: SidebarConfig | null | undefined;
  /** Called when config changes */
  onChange: (config: SidebarConfig | null) => void;
  /** Available solutions for multi-select */
  solutions?: EntityItem[];
  /** Available articles */
  articles?: EntityItem[];
  /** Available programs */
  programs?: EntityItem[];
  /** Available projects */
  projects?: EntityItem[];
  /** The entity type that owns this config (to exclude from widget type options) */
  ownerType?: SidebarWidgetType;
}

const DEFAULT_CTA: SidebarCtaConfig = {
  enabled: true,
  title: "",
  description: "",
  primaryLabel: "",
  primaryHref: "/contact",
  secondaryLabel: "",
  secondaryHref: "",
};

export function SidebarConfigPanel({
  value,
  onChange,
  solutions = [],
  articles = [],
  programs = [],
  projects = [],
  ownerType,
}: SidebarConfigPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const config: SidebarConfig = value ?? { mode: "auto" };
  const isCustom = config.mode === "custom";

  /* ── Helpers ── */

  const update = (patch: Partial<SidebarConfig>) => {
    onChange({ ...config, ...patch });
  };

  const updateWidget = (idx: number, patch: Partial<SidebarWidgetConfig>) => {
    const widgets = [...(config.widgets || [])];
    widgets[idx] = { ...widgets[idx], ...patch };
    update({ widgets });
  };

  const removeWidget = (idx: number) => {
    const widgets = [...(config.widgets || [])];
    widgets.splice(idx, 1);
    update({ widgets });
  };

  const addWidget = () => {
    const usedTypes = (config.widgets || []).map((w) => w.type);
    const availableTypes = WIDGET_TYPE_OPTIONS.filter(
      (o) => !usedTypes.includes(o.value) && o.value !== ownerType,
    );
    const newType = availableTypes[0]?.value || "solutions";
    update({
      widgets: [...(config.widgets || []), { type: newType, maxItems: 3 }],
    });
  };

  const updateCta = (patch: Partial<SidebarCtaConfig>) => {
    update({ cta: { ...(config.cta || DEFAULT_CTA), ...patch } });
  };

  /* ── Entity lookup by widget type ── */

  const getItemsForType = (type: SidebarWidgetType): EntityItem[] => {
    switch (type) {
      case "solutions":
        return solutions;
      case "articles":
        return articles;
      case "programs":
        return programs;
      case "projects":
        return projects;
      default:
        return [];
    }
  };

  const canAddMore =
    (config.widgets || []).length < WIDGET_TYPE_OPTIONS.length - (ownerType ? 1 : 0);

  return (
    <div className="mt-5 border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Cấu hình Sidebar Widget
        </h4>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? "▼ Thu gọn" : "▶ Mở rộng"}
        </button>
      </div>

      {!expanded && (
        <p className="mt-1 text-xs text-text-muted">
          {isCustom
            ? `Tuỳ chỉnh — ${(config.widgets || []).length} widget`
            : "Tự động (hiển thị nội dung liên quan mặc định)"}
        </p>
      )}

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-semibold text-text">Chế độ:</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="sidebar-mode"
                  checked={!isCustom}
                  onChange={() => update({ mode: "auto", widgets: undefined })}
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="text-xs text-text">Tự động</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="sidebar-mode"
                  checked={isCustom}
                  onChange={() =>
                    update({ mode: "custom", widgets: config.widgets || [] })
                  }
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="text-xs text-text">Tuỳ chỉnh</span>
              </label>
            </div>
          </div>

          {/* Custom widgets */}
          {isCustom && (
            <div className="space-y-3">
              {(config.widgets || []).map((widget, idx) => {
                const items = getItemsForType(widget.type);
                const selectedSlugs = widget.itemSlugs || [];

                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-surface-alt p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Widget {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWidget(idx)}
                        className="text-xs text-danger hover:underline"
                      >
                        Xoá
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-text">
                          Loại nội dung
                        </label>
                        <DropdownSelect
                          value={widget.type}
                          onChange={(val) =>
                            updateWidget(idx, {
                              type: val as SidebarWidgetType,
                              itemSlugs: [],
                            })
                          }
                          options={WIDGET_TYPE_OPTIONS.map((o) => ({
                            value: o.value,
                            label: o.label,
                          }))}
                        />
                      </div>

                      <FormInput
                        label="Tiêu đề widget (tuỳ chọn)"
                        placeholder="VD: Giải pháp UAV liên quan"
                        value={widget.title || ""}
                        onChange={(e) =>
                          updateWidget(idx, {
                            title: e.target.value || undefined,
                          })
                        }
                      />
                    </div>

                    {/* Multi-select items */}
                    {items.length > 0 && (
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-text">
                          Chọn nội dung hiển thị
                          <span className="font-normal text-text-muted ml-1">
                            (bỏ trống = tự động)
                          </span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto rounded-md border border-border p-2 bg-surface">
                          {items.map((item) => {
                            const slug = item.slug || item.id;
                            const isSelected = selectedSlugs.includes(slug);
                            return (
                              <label
                                key={item.id}
                                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs cursor-pointer transition-all border ${
                                  isSelected
                                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                    : "bg-surface border-border text-text-muted hover:border-primary/20"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    const newSlugs = isSelected
                                      ? selectedSlugs.filter((s) => s !== slug)
                                      : [...selectedSlugs, slug];
                                    updateWidget(idx, { itemSlugs: newSlugs });
                                  }}
                                  className="sr-only"
                                />
                                <span
                                  className={`w-3 h-3 rounded border flex items-center justify-center ${
                                    isSelected
                                      ? "bg-primary border-primary"
                                      : "border-border"
                                  }`}
                                >
                                  {isSelected && (
                                    <svg
                                      className="w-2 h-2 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </span>
                                {item.title}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add widget button */}
              {canAddMore && (
                <button
                  type="button"
                  onClick={addWidget}
                  className="w-full rounded-lg border border-dashed border-border py-2.5 text-xs font-medium text-text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  + Thêm widget
                </button>
              )}
            </div>
          )}

          {/* CTA Config */}
          {isCustom && (
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text">
                  CTA Widget
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cta?.enabled !== false}
                    onChange={(e) =>
                      updateCta({ enabled: e.target.checked })
                    }
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className="text-xs text-text">Hiển thị</span>
                </label>
              </div>

              {config.cta?.enabled !== false && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormInput
                    label="Tiêu đề CTA"
                    placeholder="VD: Yêu cầu tư vấn giải pháp"
                    value={config.cta?.title || ""}
                    onChange={(e) =>
                      updateCta({ title: e.target.value || undefined })
                    }
                  />
                  <FormInput
                    label="Mô tả CTA"
                    placeholder="VD: Đăng ký để nhận demo sản phẩm..."
                    value={config.cta?.description || ""}
                    onChange={(e) =>
                      updateCta({ description: e.target.value || undefined })
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
