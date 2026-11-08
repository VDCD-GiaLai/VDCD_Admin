/**
 * Single slide item for multi-slide page banners (e.g., Careers hero slider).
 */
export interface PageBannerSlide {
  id: string;
  title: string;
  subtitle: string | null;
  tag: string | null;
  imageUrl: string;
  imageFileId: string | null;
}

/**
 * Raw item stored in `page_banner.cta_buttons` JSONB column.
 * Supports both standard CTA buttons and serialized slide entries (`_type: "slide"`).
 */
export interface PageBannerCtaItem {
  label: string;
  href: string;
  variant?: string;
  ariaLabel?: string;
  _type?: "cta" | "slide";
  id?: string;
  title?: string;
  subtitle?: string | null;
  tag?: string | null;
  imageUrl?: string;
  imageFileId?: string | null;
}

/**
 * Page Banner — banner assigned to specific pages.
 * Maps to DB `page_banner` table + /page-banners API.
 */
export interface PageBanner {
  id: string;
  pageKey: string;
  title: string;
  subtitle: string | null;
  tag: string | null;
  imageUrl: string;
  imageFileId: string | null;
  ctaButtons: PageBannerCtaItem[] | null;
  slides?: PageBannerSlide[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
