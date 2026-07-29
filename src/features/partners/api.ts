import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Partner } from "@/types/partner";
import type { PartnerFormData } from "./schema";

// ─── Query keys ──────────────────────────────────────────────

export const partnerKeys = {
  all: ["partners"] as const,
  list: () => [...partnerKeys.all, "list"] as const,
  detail: (id: string) => [...partnerKeys.all, "detail", id] as const,
};

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /partners/all — all partners (including inactive), for admin.
 */
export function usePartners() {
  return useQuery<Partner[]>({
    queryKey: partnerKeys.list(),
    queryFn: () => clientFetch<Partner[]>("/api/partners/all"),
  });
}

/**
 * GET /partners/:id — single partner (by ID, not by slug).
 * Note: partners API doesn't have a detail by ID endpoint.
 * We fetch the full list and filter client-side.
 */
export function usePartner(id: string) {
  const { data: partners, ...rest } = usePartners();
  const partner = partners?.find((p) => p.id === id);
  return { data: partner, ...rest };
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * POST /partners — create a new partner.
 */
export function useCreatePartner() {
  const queryClient = useQueryClient();

  return useMutation<Partner, ApiError, PartnerFormData>({
    mutationFn: (data) =>
      clientFetch<Partner>("/api/partners", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

/**
 * PATCH /partners/:id — update a partner.
 */
export function useUpdatePartner(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Partner, ApiError, Partial<PartnerFormData>>({
    mutationFn: (data) =>
      clientFetch<Partner>(`/api/partners/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

/**
 * PATCH /partners/reorder — reorder partners.
 */
export function useReorderPartners() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; order: number }[]>({
    mutationFn: (items) =>
      clientFetch<void>("/api/partners/reorder", {
        method: "PATCH",
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

/**
 * PATCH /partners/:id/toggle — toggle active status.
 */
export function useTogglePartner() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) =>
      clientFetch<void>(`/api/partners/${id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

/**
 * DELETE /partners/:id — delete a partner (superadmin only).
 */
export function useDeletePartner() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/partners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}
