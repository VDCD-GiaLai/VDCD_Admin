import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Project, ProjectImage } from "@/types/project";
import type { PaginatedData } from "@/types/api";
import type { ProjectFormData } from "./schema";

export const projectKeys = {
  all: ["projects"] as const,
  list: (filters?: ProjectFilters) =>
    [...projectKeys.all, "list", filters] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};

export interface ProjectFilters {
  page?: number;
  limit?: number;
  fieldId?: string;
  provinceId?: string;
  year?: number;
  isPublished?: boolean | "";
}

function buildQuery(filters?: ProjectFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.fieldId) params.set("fieldId", filters.fieldId);
  if (filters.provinceId) params.set("provinceId", filters.provinceId);
  if (filters.year) params.set("year", String(filters.year));
  if (filters.isPublished !== undefined && filters.isPublished !== "")
    params.set("isPublished", String(filters.isPublished));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useProjects(filters?: ProjectFilters) {
  return useQuery<PaginatedData<Project>>({
    queryKey: projectKeys.list(filters),
    queryFn: () =>
      clientFetch<PaginatedData<Project>>(
        `/api/projects/all${buildQuery(filters)}`,
      ),
  });
}

export function useProject(id: string) {
  const { data: projectsData, ...rest } = useProjects({ limit: 100 });
  // Fallback to fetch single project via slug if not in list (BFF translates slug->id or we just fetch details)
  // Actually, BFF might not have GET /projects/:id, only /projects/:slug.
  // But wait! BFF endpoints for single item is usually by slug. The list has the full object though.
  // The DB_SCHEMA says GET /projects/:slug
  // For admin edit, we can rely on list cache.
  const project = projectsData?.items?.find((p) => p.id === id);
  return { data: project, ...rest };
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation<Project, ApiError, ProjectFormData>({
    mutationFn: (data) =>
      clientFetch<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Project, ApiError, Partial<ProjectFormData>>({
    mutationFn: (data) =>
      clientFetch<Project>(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function usePublishProject() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: string; isPublished: boolean }>({
    mutationFn: ({ id, isPublished }) =>
      clientFetch<void>(`/api/projects/${id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// ─── Gallery Mutations ───────────────────────────────────────

/**
 * Upload multiple images directly to Project gallery.
 */
export function useUploadProjectImages(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<ProjectImage[], Error, { files: File[]; captions?: string[] }>({
    mutationFn: async ({ files, captions }) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      if (captions && captions.length > 0) {
        formData.append("captions", JSON.stringify(captions));
      }

      // Since we need multipart/form-data and clientFetch defaults to JSON,
      // we'll use native fetch for this specific endpoint.
      const res = await fetch(`/api/projects/${projectId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Upload failed");
      }

      const json = await res.json();
      return json.data ?? json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Reorder gallery images
 */
export function useReorderProjectImages(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: string; order: number }[]>({
    mutationFn: (items) =>
      clientFetch<void>(`/api/projects/${projectId}/images/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Delete an image from gallery
 */
export function useDeleteProjectImage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (imageId) =>
      clientFetch<void>(`/api/projects/${projectId}/images/${imageId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
