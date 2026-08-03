/**
 * Organization — single-row config.
 * Maps to DB `organization` table + GET/PUT /organization API.
 */

export interface OrganizationStats {
  provinces?: number;
  centers?: number;
  projects?: number;
  staff?: number;
}

export interface OrganizationSocialLinks {
  facebook?: string;
  zalo?: string;
  youtube?: string;
  [key: string]: string | undefined;
}

export interface Organization {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  mission: string | null;
  vision: string | null;
  coreValues: string | null;
  foundedYear: number | null;
  address: string | null;
  stats: OrganizationStats | null;
  socialLinks: Record<string, string> | null;
  updatedAt: string;
}
