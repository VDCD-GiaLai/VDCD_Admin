/**
 * Slide — homepage slideshow.
 * Maps to DB `slide` table + /slides API.
 */
export interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  imageUrl: string;
  imageFileId: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}
