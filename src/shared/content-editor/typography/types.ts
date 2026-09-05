export type TypographyScale =
  | "xs"
  | "sm"
  | "base"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl";

export interface TypographyConfig {
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  color?: string;
}
