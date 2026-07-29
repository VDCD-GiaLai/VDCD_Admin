import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Province } from "@/types/province";
import type { ProvinceFormData } from "./schema";

// ─── Query keys ──────────────────────────────────────────────

export const provinceKeys = {
  all: ["provinces"] as const,
  list: () => [...provinceKeys.all, "list"] as const,
  detail: (id: string) => [...provinceKeys.all, "detail", id] as const,
};

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /provinces — all provinces sorted by name.
 */
export function useProvinces() {
  return useQuery<Province[]>({
    queryKey: provinceKeys.list(),
    queryFn: () => clientFetch<Province[]>("/api/provinces"),
  });
}

/**
 * Single province by ID — from the full list.
 */
export function useProvince(id: string) {
  const { data: provinces, ...rest } = useProvinces();
  const province = provinces?.find((p) => p.id === id);
  return { data: province, ...rest };
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * POST /provinces — create a new province.
 */
export function useCreateProvince() {
  const queryClient = useQueryClient();

  return useMutation<Province, ApiError, ProvinceFormData>({
    mutationFn: (data) =>
      clientFetch<Province>("/api/provinces", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provinceKeys.all });
    },
  });
}

/**
 * PATCH /provinces/:id — update a province.
 */
export function useUpdateProvince(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Province, ApiError, Partial<ProvinceFormData>>({
    mutationFn: (data) =>
      clientFetch<Province>(`/api/provinces/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provinceKeys.all });
    },
  });
}

/**
 * DELETE /provinces/:id — delete a province.
 */
export function useDeleteProvince() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/provinces/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provinceKeys.all });
    },
  });
}
