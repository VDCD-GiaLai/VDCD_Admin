/**
 * Lead — Contact forms module.
 * Maps to DB `lead` table + /leads API.
 */
export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  attachment: string | null;
  isRead: boolean;
  dob: string | null;
  address: string | null;
  experienceYears: string | null;
  expectedSalary: string | null;
  portfolioUrl: string | null;
  coverLetter: string | null;
  source: string | null;
  createdAt: string;
}
