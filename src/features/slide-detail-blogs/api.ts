import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { PaginatedData } from "@/types/api";
import type {
  SlideDetailBlog,
  SlideDetailBlogListItem,
  SlideDetailBlogFilters,
} from "@/types/slide-detail-blog";
import type { SlideDetailBlogFormData } from "./schema";

// ─── Query keys ──────────────────────────────────────────────

export const slideDetailBlogKeys = {
  all: ["slide-detail-blogs"] as const,
  list: (filters?: SlideDetailBlogFilters) =>
    [...slideDetailBlogKeys.all, "list", filters] as const,
  detail: (id: string) => [...slideDetailBlogKeys.all, "detail", id] as const,
  bySlide: (slideId: string) =>
    [...slideDetailBlogKeys.all, "by-slide", slideId] as const,
};

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /slide-detail-blogs/all — paginated list of blogs for admin.
 */
export function useSlideDetailBlogs(filters?: SlideDetailBlogFilters) {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.set("page", String(filters.page));
  if (filters?.limit) queryParams.set("limit", String(filters.limit));
  if (filters?.search) queryParams.set("search", filters.search);
  if (typeof filters?.isPublished === "boolean") {
    queryParams.set("isPublished", String(filters.isPublished));
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/slide-detail-blogs/all${queryString ? `?${queryString}` : ""}`;

  return useQuery<PaginatedData<SlideDetailBlogListItem>>({
    queryKey: slideDetailBlogKeys.list(filters),
    queryFn: () => clientFetch<PaginatedData<SlideDetailBlogListItem>>(endpoint),
  });
}

/**
 * GET /slide-detail-blogs/admin/:id — full blog detail including content blocks.
 */
export function useSlideDetailBlog(id: string) {
  return useQuery<SlideDetailBlog>({
    queryKey: slideDetailBlogKeys.detail(id),
    queryFn: () => clientFetch<SlideDetailBlog>(`/api/slide-detail-blogs/admin/${id}`),
    enabled: !!id,
  });
}

/**
 * GET /slide-detail-blogs/admin/by-slide/:slideId — get blog by slide ID.
 */
export function useSlideDetailBlogBySlide(slideId: string, enabled = true) {
  return useQuery<SlideDetailBlog | null>({
    queryKey: slideDetailBlogKeys.bySlide(slideId),
    queryFn: async () => {
      try {
        return await clientFetch<SlideDetailBlog>(
          `/api/slide-detail-blogs/admin/by-slide/${slideId}`,
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!slideId && enabled,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * POST /slide-detail-blogs — create a new slide detail blog.
 */
export function useCreateSlideDetailBlog() {
  const queryClient = useQueryClient();

  return useMutation<SlideDetailBlog, ApiError, SlideDetailBlogFormData>({
    mutationFn: (data) =>
      clientFetch<SlideDetailBlog>("/api/slide-detail-blogs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (newBlog) => {
      queryClient.invalidateQueries({ queryKey: slideDetailBlogKeys.all });
      queryClient.setQueryData(
        slideDetailBlogKeys.bySlide(newBlog.slideId),
        newBlog,
      );
    },
  });
}

/**
 * PATCH /slide-detail-blogs/:id — update a slide detail blog.
 */
export function useUpdateSlideDetailBlog(id: string) {
  const queryClient = useQueryClient();

  return useMutation<
    SlideDetailBlog,
    ApiError,
    Partial<Omit<SlideDetailBlogFormData, "slideId">>
  >({
    mutationFn: (data) =>
      clientFetch<SlideDetailBlog>(`/api/slide-detail-blogs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (updatedBlog) => {
      queryClient.invalidateQueries({ queryKey: slideDetailBlogKeys.all });
      queryClient.setQueryData(
        slideDetailBlogKeys.detail(id),
        updatedBlog,
      );
      if (updatedBlog.slideId) {
        queryClient.setQueryData(
          slideDetailBlogKeys.bySlide(updatedBlog.slideId),
          updatedBlog,
        );
      }
    },
  });
}

/**
 * PATCH /slide-detail-blogs/:id/publish — toggle publication status.
 */
export function usePublishSlideDetailBlog() {
  const queryClient = useQueryClient();

  return useMutation<
    SlideDetailBlog,
    ApiError,
    { id: string; isPublished: boolean }
  >({
    mutationFn: ({ id, isPublished }) =>
      clientFetch<SlideDetailBlog>(`/api/slide-detail-blogs/${id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished }),
      }),
    onSuccess: (updatedBlog) => {
      queryClient.invalidateQueries({ queryKey: slideDetailBlogKeys.all });
      queryClient.setQueryData(
        slideDetailBlogKeys.detail(updatedBlog.id),
        updatedBlog,
      );
      if (updatedBlog.slideId) {
        queryClient.setQueryData(
          slideDetailBlogKeys.bySlide(updatedBlog.slideId),
          updatedBlog,
        );
      }
    },
  });
}

/**
 * DELETE /slide-detail-blogs/:id — delete a slide detail blog (superadmin only).
 */
export function useDeleteSlideDetailBlog() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { id: string; slideId?: string }>({
    mutationFn: ({ id }) =>
      clientFetch<void>(`/api/slide-detail-blogs/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_, { slideId }) => {
      queryClient.invalidateQueries({ queryKey: slideDetailBlogKeys.all });
      if (slideId) {
        queryClient.setQueryData(slideDetailBlogKeys.bySlide(slideId), null);
      }
    },
  });
}
