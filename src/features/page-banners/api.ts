import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { PageBanner } from "@/types/page-banner";
import type { PageBannerFormData } from "./schema";

// ─── Query keys ──────────────────────────────────────────────

export const pageBannerKeys = {
  all: ["page-banners"] as const,
  list: () => [...pageBannerKeys.all, "list"] as const,
};

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /page-banners — all banners.
 */
export function usePageBanners() {
  return useQuery<PageBanner[]>({
    queryKey: pageBannerKeys.list(),
    queryFn: () => clientFetch<PageBanner[]>("/api/page-banners"),
  });
}

/**
 * Single banner by ID — from the full list.
 */
export function usePageBanner(id: string) {
  const { data: banners, ...rest } = usePageBanners();
  const banner = banners?.find((b) => b.id === id);
  return { data: banner, ...rest };
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * POST /page-banners — create a new banner.
 */
export function useCreatePageBanner() {
  const queryClient = useQueryClient();

  return useMutation<PageBanner, ApiError, PageBannerFormData>({
    mutationFn: (data) =>
      clientFetch<PageBanner>("/api/page-banners", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageBannerKeys.all });
    },
  });
}

/**
 * PATCH /page-banners/:pageKey — update a banner.
 */
export function useUpdatePageBanner() {
  const queryClient = useQueryClient();

  return useMutation<PageBanner, ApiError, Partial<PageBannerFormData> & { pageKey: string }>({
    mutationFn: (data) =>
      clientFetch<PageBanner>(`/api/page-banners/${data.pageKey}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageBannerKeys.all });
    },
  });
}

/**
 * PATCH /page-banners/:pageKey — toggle active status.
 */
export function useTogglePageBanner() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { pageKey: string; isActive: boolean }>({
    mutationFn: ({ pageKey, isActive }) =>
      clientFetch<void>(`/api/page-banners/${pageKey}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageBannerKeys.all });
    },
  });
}

/**
 * DELETE /page-banners/:id — delete a banner (superadmin only).
 */
export function useDeletePageBanner() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/page-banners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageBannerKeys.all });
    },
  });
}
