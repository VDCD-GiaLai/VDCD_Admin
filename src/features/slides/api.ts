import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Slide } from "@/types/slide";
import type { SlideFormData } from "./schema";

// ─── Query keys ──────────────────────────────────────────────

export const slideKeys = {
  all: ["slides"] as const,
  list: () => [...slideKeys.all, "list"] as const,
};

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /slides/all — all slides (including inactive), for admin.
 */
export function useSlides() {
  return useQuery<Slide[]>({
    queryKey: slideKeys.list(),
    queryFn: () => clientFetch<Slide[]>("/api/slides/all"),
  });
}

/**
 * Single slide by ID — from the full list.
 */
export function useSlide(id: string) {
  const { data: slides, ...rest } = useSlides();
  const slide = slides?.find((s) => s.id === id);
  return { data: slide, ...rest };
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * POST /slides — create a new slide.
 */
export function useCreateSlide() {
  const queryClient = useQueryClient();

  return useMutation<Slide, ApiError, SlideFormData>({
    mutationFn: (data) =>
      clientFetch<Slide>("/api/slides", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slideKeys.all });
    },
  });
}

/**
 * PATCH /slides/:id — update a slide.
 */
export function useUpdateSlide(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Slide, ApiError, Partial<SlideFormData>>({
    mutationFn: (data) =>
      clientFetch<Slide>(`/api/slides/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slideKeys.all });
    },
  });
}

/**
 * PATCH /slides/reorder — reorder slides.
 */
export function useReorderSlides() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; order: number }[]>({
    mutationFn: (items) =>
      clientFetch<void>("/api/slides/reorder", {
        method: "PATCH",
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slideKeys.all });
    },
  });
}

/**
 * PATCH /slides/:id/toggle — toggle active status.
 */
export function useToggleSlide() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) =>
      clientFetch<void>(`/api/slides/${id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slideKeys.all });
    },
  });
}

/**
 * DELETE /slides/:id — delete a slide (superadmin only).
 */
export function useDeleteSlide() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/slides/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slideKeys.all });
    },
  });
}
