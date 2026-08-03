import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Contact } from "@/types/contact";
import type { PaginatedData } from "@/types/api";

// ─── Query keys ──────────────────────────────────────────────

export const contactKeys = {
  all: ["contacts"] as const,
  list: (filters?: ContactFilters) =>
    [...contactKeys.all, "list", filters] as const,
  detail: (id: string) => [...contactKeys.all, "detail", id] as const,
};

// ─── Filter types ────────────────────────────────────────────

export interface ContactFilters {
  page?: number;
  limit?: number;
  isRead?: boolean | "";
}

function buildQuery(filters?: ContactFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.isRead !== undefined && filters.isRead !== "") {
    params.set("isRead", String(filters.isRead));
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /contacts — list of contacts (paginated, with filters).
 */
export function useContacts(filters?: ContactFilters) {
  return useQuery<PaginatedData<Contact>>({
    queryKey: contactKeys.list(filters),
    queryFn: () => clientFetch<PaginatedData<Contact>>(`/api/contacts${buildQuery(filters)}`),
  });
}

/**
 * GET /contacts/:id — single contact details.
 */
export function useContact(id: string) {
  return useQuery<Contact>({
    queryKey: contactKeys.detail(id),
    queryFn: () => clientFetch<Contact>(`/api/contacts/${id}`),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * PATCH /contacts/:id/read — mark as read.
 */
export function useToggleReadContact() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; isRead: boolean }>({
    mutationFn: ({ id, isRead }) =>
      clientFetch<void>(`/api/contacts/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({ isRead }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}

/**
 * DELETE /contacts/:id — delete a contact (superadmin only).
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}

// ─── Export ──────────────────────────────────────────────────

/**
 * Export contacts to CSV. Note: we don't use React Query for file downloads.
 */
export async function exportContactsCSV(filters?: ContactFilters) {
  const query = buildQuery(filters);
  const response = await fetch(`/api/contacts/export${query}`, {
    method: "GET",
  });
  
  if (!response.ok) {
    throw new Error("Không thể xuất file CSV");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
