/**
 * Shared Typography tokens and scale presets for Content Editor.
 */

export const FONT_SIZE_PRESETS = [
  { label: "Nhỏ (14px)", value: 14 },
  { label: "Mặc định (16px)", value: 16 },
  { label: "Vừa (18px)", value: 18 },
  { label: "Lớn (20px)", value: 20 },
  { label: "Rất lớn (24px)", value: 24 },
  { label: "Tiêu đề nhỏ (28px)", value: 28 },
  { label: "Tiêu đề vừa (32px)", value: 32 },
  { label: "Tiêu đề lớn (36px)", value: 36 },
  { label: "Banner (48px)", value: 48 },
] as const;

export const HEADING_DEFAULT_SIZES = {
  1: 36, // 36px default for H1
  2: 28, // 28px default for H2
  3: 24, // 24px default for H3
  4: 20, // 20px default for H4
  5: 18, // 18px default for H5
  6: 16, // 16px default for H6
} as const;

export const LINE_HEIGHT_PRESETS = [
  { label: "Chặt chẽ (1.2)", value: 1.2 },
  { label: "Tiêu chuẩn (1.5)", value: 1.5 },
  { label: "Thoáng (1.75)", value: 1.75 },
  { label: "Rộng (2.0)", value: 2.0 },
] as const;

export const FONT_FAMILY_PRESETS = [
  { label: "Hệ thống (Mặc định)", value: "" },
  { label: "Sans Serif (Inter / Roboto)", value: "font-sans" },
  { label: "Serif (Merriweather)", value: "font-serif" },
  { label: "Monospace (Mã code)", value: "font-mono" },
] as const;
