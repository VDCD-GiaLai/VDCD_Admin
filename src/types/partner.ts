/**
 * Partner — clients & partners (logo display).
 * Maps to DB `partner` table + /partners API.
 */
export interface Partner {
  id: string;
  name: string;
  logo: string;
  logoFileId: string | null;
  websiteUrl: string | null;
  order: number;
  isActive: boolean;
}
