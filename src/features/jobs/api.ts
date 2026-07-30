import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Job } from "@/types/job";
import type { PaginatedData } from "@/types/api";
import type { JobFormData } from "./schema";

// ─── Query keys ──────────────────────────────────────────────

export const jobKeys = {
  all: ["jobs"] as const,
  list: (filters?: JobFilters) => [...jobKeys.all, "list", filters] as const,
  detail: (id: string) => [...jobKeys.all, "detail", id] as const,
};

// ─── Filter types ────────────────────────────────────────────

export interface JobFilters {
  page?: number;
  limit?: number;
  type?: string;
  isActive?: boolean | "";
}

function buildQuery(filters?: JobFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.type) params.set("type", filters.type);
  if (filters.isActive !== undefined && filters.isActive !== "")
    params.set("isActive", String(filters.isActive));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /jobs/all — all jobs (including inactive), paginated.
 */
export function useJobs(filters?: JobFilters) {
  return useQuery<PaginatedData<Job>>({
    queryKey: jobKeys.list(filters),
    queryFn: () =>
      clientFetch<PaginatedData<Job>>(`/api/jobs/all${buildQuery(filters)}`),
  });
}

/**
 * Single job by ID — fetch directly from BE list.
 */
export function useJob(id: string) {
  const { data: jobsData, ...rest } = useJobs({ limit: 100 });
  const job = jobsData?.items?.find((j) => j.id === id);
  return { data: job, ...rest };
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * POST /jobs — create a new job.
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation<Job, ApiError, JobFormData>({
    mutationFn: (data) =>
      clientFetch<Job>("/api/jobs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

/**
 * PATCH /jobs/:id — update a job.
 */
export function useUpdateJob(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Job, ApiError, Partial<JobFormData>>({
    mutationFn: (data) =>
      clientFetch<Job>(`/api/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

/**
 * PATCH /jobs/:id/toggle — toggle active status.
 */
export function useToggleJob() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) =>
      clientFetch<void>(`/api/jobs/${id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

/**
 * DELETE /jobs/:id — delete a job (superadmin only).
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/jobs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
