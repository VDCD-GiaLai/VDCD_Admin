/**
 * Job — Recruitment module.
 * Maps to DB `job` table + /jobs API.
 */
export interface Job {
  id: string;
  title: string;
  slug: string;
  department: string | null;
  location: string | null;
  type: 'full-time' | 'part-time' | 'intern';
  salaryRange: string | null;
  deadline: string | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  isUrgent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
