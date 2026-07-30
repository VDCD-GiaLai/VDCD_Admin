import { useQuery } from "@tanstack/react-query";
import { clientFetch } from "@/lib/api-client";

// --- Types ---

export interface DashboardStats {
  unreadLeads: number;
  publishedProjects: number;
  activeJobs: number;
  urgentJobs: number;
  totalContent: number;
}

export interface LeadTrend {
  date: string;
  count: number;
}

export interface DraftContent {
  id: number;
  title: string;
  type: "program" | "solution" | "project" | "article";
  status: string;
  updatedAt: string;
}

export interface DraftsResponse {
  items: DraftContent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Hooks ---

export function useDashboardStats() {
  return useQuery<DashboardStats, Error>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      return clientFetch<DashboardStats>("/api/dashboard/stats");
    },
  });
}

export function useLeadTrends(range: string = "7days") {
  return useQuery<LeadTrend[], Error>({
    queryKey: ["dashboard", "lead-trends", range],
    queryFn: async () => {
      return clientFetch<LeadTrend[]>(`/api/dashboard/lead-trends?range=${range}`);
    },
  });
}

export function useDashboardDrafts(page: number = 1, limit: number = 5) {
  return useQuery<DraftsResponse, Error>({
    queryKey: ["dashboard", "drafts", page, limit],
    queryFn: async () => {
      return clientFetch<DraftsResponse>(`/api/dashboard/drafts?page=${page}&limit=${limit}`);
    },
  });
}
