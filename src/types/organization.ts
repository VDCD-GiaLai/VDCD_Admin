/**
 * Organization — single-row config.
 * Maps to DB `organization` table + GET/PUT /organization API.
 */

export interface OrganizationStats {
  staff?: number;
  experts?: number;
  provinces?: number;
  projects?: number;
  centers?: number;
  subsidiaries?: number;
}

export interface OrganizationSocialLinks {
  facebook?: string;
  zalo?: string;
  youtube?: string;
  [key: string]: string | undefined;
}

export interface OperationFieldItem {
  title: string;
  description: string;
}

export interface DevelopmentOrientationItem {
  title: string;
  description: string;
}

export interface Organization {
  id: string;
  name: string;
  tagline: string | null;
  businessLicenseNo: string | null;
  description: string | null;
  mission: string | null;
  vision: string | null;
  coreValues: string | null;
  foundedYear: number | null;
  address: string | null;
  stats: OrganizationStats | null;
  socialLinks: Record<string, string> | null;
  operationFields: OperationFieldItem[] | null;
  ecosystemCapabilities: string | null;
  developmentOrientations: DevelopmentOrientationItem[] | null;
  updatedAt: string;
}
