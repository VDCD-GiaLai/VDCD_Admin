import { z } from "zod";

// DTOs matching the proposed API responses

export const dashboardStatsSchema = z.object({
  unreadLeads: z.number(),
  publishedProjects: z.number(),
  activeJobs: z.number(),
  urgentJobs: z.number(),
  totalContent: z.number(), // programs + solutions + projects + articles
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

export const draftContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["program", "solution", "project", "article"]),
  updatedAt: z.string(),
});

export type DraftContent = z.infer<typeof draftContentSchema>;

export const draftContentListSchema = z.object({
  items: z.array(draftContentSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type DraftContentList = z.infer<typeof draftContentListSchema>;

export const leadTrendSchema = z.object({
  date: z.string(),
  count: z.number(),
});

export type LeadTrend = z.infer<typeof leadTrendSchema>;
