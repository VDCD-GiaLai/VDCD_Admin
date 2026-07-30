import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Lead } from "@/types/lead";
import type { PaginatedData } from "@/types/api";

// ─── Query keys ──────────────────────────────────────────────

export const leadKeys = {
  all: ["leads"] as const,
  list: (filters?: LeadFilters) => [...leadKeys.all, "list", filters] as const,
  detail: (id: string) => [...leadKeys.all, "detail", id] as const,
};

// ─── Filter types ────────────────────────────────────────────

export interface LeadFilters {
  page?: number;
  limit?: number;
  isRead?: boolean | "";
}

function buildQuery(filters?: LeadFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.isRead !== undefined && filters.isRead !== "")
    params.set("isRead", String(filters.isRead));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /leads — all leads, paginated.
 */
export function useLeads(filters?: LeadFilters) {
  return useQuery<PaginatedData<Lead>>({
    queryKey: leadKeys.list(filters),
    queryFn: () =>
      clientFetch<PaginatedData<Lead>>(`/api/leads${buildQuery(filters)}`),
  });
}

/**
 * Single lead by ID (also marks as read implicitly on BE).
 */
export function useLead(id: string) {
  return useQuery<Lead>({
    queryKey: leadKeys.detail(id),
    queryFn: () => clientFetch<Lead>(`/api/leads/${id}`),
  });
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * PATCH /leads/:id/read — toggle read status.
 */
export function useMarkLeadRead() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; isRead: boolean }>({
    mutationFn: ({ id, isRead }) =>
      clientFetch<void>(`/api/leads/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({ isRead }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

/**
 * DELETE /leads/:id — delete a lead (superadmin only).
 */
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Construct export CSV url. The frontend should just trigger download.
 * We'll let `clientFetch` handle it if we want to add auth headers properly.
 */
export async function downloadLeadsCsv(from?: string, to?: string): Promise<Blob> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  
  // Need to use native fetch for Blob with credentials if needed,
  // but clientFetch might assume JSON. Let's use native fetch with the same setup.
  // Actually, we can just return the raw fetch response inside `clientFetch`? No `clientFetch` returns parsed JSON.
  // I will write a custom fetch here or open in new tab if cookie auth works.
  // Since auth is via HttpOnly cookie, opening in a new window/tab works for downloading!
  const url = `/api/leads/export${qs ? `?${qs}` : ""}`;
  window.open(url, "_blank");
  return new Blob(); // dummy return
}
