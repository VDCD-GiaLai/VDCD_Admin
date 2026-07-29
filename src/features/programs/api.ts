import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Program } from "@/types/program";
import type { PaginatedData } from "@/types/api";
import type { ProgramFormData } from "./schema";

// ─── Query keys ──────────────────────────────────────────────

export const programKeys = {
  all: ["programs"] as const,
  list: (filters?: ProgramFilters) =>
    [...programKeys.all, "list", filters] as const,
  detail: (id: string) => [...programKeys.all, "detail", id] as const,
};

// ─── Filter types ────────────────────────────────────────────

export interface ProgramFilters {
  page?: number;
  limit?: number;
  fieldId?: string;
  isPublished?: boolean | "";
}

function buildQuery(filters?: ProgramFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.fieldId) params.set("fieldId", filters.fieldId);
  if (filters.isPublished !== undefined && filters.isPublished !== "")
    params.set("isPublished", String(filters.isPublished));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /programs/all — all programs (including unpublished), paginated.
 */
export function usePrograms(filters?: ProgramFilters) {
  return useQuery<PaginatedData<Program>>({
    queryKey: programKeys.list(filters),
    queryFn: () =>
      clientFetch<PaginatedData<Program>>(
        `/api/programs/all${buildQuery(filters)}`,
      ),
  });
}

/**
 * Single program by ID — fetch directly from BE.
 */
export function useProgram(id: string) {
  const { data: programsData, ...rest } = usePrograms({ limit: 100 });
  const program = programsData?.items?.find((p) => p.id === id);
  return { data: program, ...rest };
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * POST /programs — create a new program.
 */
export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation<Program, ApiError, ProgramFormData>({
    mutationFn: (data) =>
      clientFetch<Program>("/api/programs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.all });
    },
  });
}

/**
 * PATCH /programs/:id — update a program.
 */
export function useUpdateProgram(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Program, ApiError, Partial<ProgramFormData>>({
    mutationFn: (data) =>
      clientFetch<Program>(`/api/programs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.all });
    },
  });
}

/**
 * PATCH /programs/:id/publish — toggle publish status.
 */
export function usePublishProgram() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; isPublished: boolean }>({
    mutationFn: ({ id, isPublished }) =>
      clientFetch<void>(`/api/programs/${id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.all });
    },
  });
}

/**
 * DELETE /programs/:id — delete a program (superadmin only).
 */
export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/programs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.all });
    },
  });
}
