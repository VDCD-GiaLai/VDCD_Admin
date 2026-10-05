/**
 * Sidebar widget configuration — stored as JSON field on Article/Program/Solution entities.
 * Allows admin to customise which widgets appear on the detail page sidebar.
 */

/* ── Widget types that can appear in sidebar ── */

export type SidebarWidgetType =
  | "solutions"
  | "articles"
  | "programs"
  | "projects"
  | "slides";

export interface SidebarWidgetConfig {
  /** Which entity type to display */
  type: SidebarWidgetType;
  /** Override the default widget title (e.g. "Giải pháp UAV" instead of "Giải pháp nổi bật") */
  title?: string;
  /** Specific item IDs to display — when empty, shows auto-selected items */
  itemSlugs?: string[];
  /** Maximum items to show (default: 3) */
  maxItems?: number;
}

export interface SidebarCtaConfig {
  /** Whether to show the CTA widget */
  enabled: boolean;
  /** Override CTA title */
  title?: string;
  /** Override CTA description */
  description?: string;
  /** Override primary button label */
  primaryLabel?: string;
  /** Override primary button href */
  primaryHref?: string;
  /** Override secondary button label */
  secondaryLabel?: string;
  /** Override secondary button href */
  secondaryHref?: string;
}

export interface SidebarConfig {
  /**
   * "auto" = default behavior (show related items by same field/category)
   * "custom" = admin has explicitly configured what to show
   */
  mode: "auto" | "custom";
  /** Widget list — only used when mode = "custom" */
  widgets?: SidebarWidgetConfig[];
  /** CTA widget config — override defaults */
  cta?: SidebarCtaConfig;
}
