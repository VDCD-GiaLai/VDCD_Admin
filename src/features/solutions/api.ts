import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Solution } from "@/types/solution";
import type { PaginatedData } from "@/types/api";
import type { SolutionFormData } from "./schema";

export const solutionKeys = {
  all: ["solutions"] as const,
  list: (filters?: SolutionFilters) =>
    [...solutionKeys.all, "list", filters] as const,
  detail: (id: string) => [...solutionKeys.all, "detail", id] as const,
};

export interface SolutionFilters {
  page?: number;
  limit?: number;
  fieldId?: string;
  isPublished?: boolean | "";
}

function buildQuery(filters?: SolutionFilters): string {
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

export function useSolutions(filters?: SolutionFilters) {
  return useQuery<PaginatedData<Solution>>({
    queryKey: solutionKeys.list(filters),
    queryFn: () =>
      clientFetch<PaginatedData<Solution>>(
        `/api/solutions/all${buildQuery(filters)}`,
      ),
  });
}

export function useSolution(id: string) {
  const { data: solutionsData, ...rest } = useSolutions({ limit: 100 });
  const solution = solutionsData?.items?.find((s) => s.id === id);
  return { data: solution, ...rest };
}

export function useCreateSolution() {
  const queryClient = useQueryClient();
  return useMutation<Solution, ApiError, SolutionFormData>({
    mutationFn: (data) =>
      clientFetch<Solution>("/api/solutions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all });
    },
  });
}

export function useUpdateSolution(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Solution, ApiError, Partial<SolutionFormData>>({
    mutationFn: (data) =>
      clientFetch<Solution>(`/api/solutions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all });
    },
  });
}

export function usePublishSolution() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: string; isPublished: boolean }>({
    mutationFn: ({ id, isPublished }) =>
      clientFetch<void>(`/api/solutions/${id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all });
    },
  });
}

export function useDeleteSolution() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/solutions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.all });
    },
  });
}
