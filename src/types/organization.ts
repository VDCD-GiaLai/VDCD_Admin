/**
 * Organization — single-row config.
 * Maps to DB `organization` table + GET/PUT/PATCH /organization API.
 * Supports all content blocks for the About Us page (/about-us).
 */

export interface OrganizationStats {
  staff?: number;
  experts?: number;
  provinces?: number;
  projects?: number;
  centers?: number;
  subsidiaries?: number;
}

export interface OrganizationStatItem {
  key?: string;
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface OrganizationSocialLinks {
  facebook?: string;
  zalo?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
  messenger?: string;
  [key: string]: string | undefined;
}

export interface OrganizationLeader {
  name?: string;
  role?: string;
  quote?: string;
  avatarUrl?: string;
  avatarFileId?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface OrganizationAnnouncement {
  text?: string;
  link?: string;
  isActive?: boolean;
  imageUrl?: string;
  imageFileId?: string;
}

export interface OrganizationCoreValueItem {
  title: string;
  description?: string;
  icon?: string;
}

export interface OrganizationEcosystemMember {
  id?: string;
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  websiteUrl?: string;
  order?: number;
}

export interface OperationFieldItem {
  title: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  order?: number;
}

export interface DevelopmentOrientationItem {
  title: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface OrganizationCtaSection {
  badge?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  subtext?: string;
}

export interface Organization {
  id: string;
  name: string;
  shortName: string | null;
  tagline: string | null;
  businessLicenseNo: string | null;
  description: string | null;
  mission: string | null;
  vision: string | null;
  coreValues: string | null;
  coreValuesList: OrganizationCoreValueItem[] | null;
  foundedYear: number | null;
  address: string | null;
  email: string | null;
  hotline: string | null;
  announcement: OrganizationAnnouncement | null;
  leader: OrganizationLeader | null;
  stats: OrganizationStats | null;
  statsList: OrganizationStatItem[] | null;
  socialLinks: Record<string, string> | null;
  operationFields: OperationFieldItem[] | null;
  ecosystemCapabilities: string | null;
  ecosystemMembers: OrganizationEcosystemMember[] | null;
  developmentOrientations: DevelopmentOrientationItem[] | null;
  ctaSection: OrganizationCtaSection | null;
  updatedAt: string;
}
