import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Article } from "@/types/article";
import type { PaginatedData } from "@/types/api";
import type { ArticleFormData } from "./schema";
import { serializeArticlePayload } from "./utils/article-content";

export const articleKeys = {
  all: ["articles"] as const,
  list: (filters?: ArticleFilters) =>
    [...articleKeys.all, "list", filters] as const,
  detail: (id: string) => [...articleKeys.all, "detail", id] as const,
};

export interface ArticleFilters {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string;
  isPublished?: boolean | "";
}

function buildQuery(filters?: ArticleFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.category) params.set("category", filters.category);
  if (filters.tags) params.set("tags", filters.tags);
  if (filters.isPublished !== undefined && filters.isPublished !== "")
    params.set("isPublished", String(filters.isPublished));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useArticles(filters?: ArticleFilters) {
  return useQuery<PaginatedData<Article>>({
    queryKey: articleKeys.list(filters),
    queryFn: () =>
      clientFetch<PaginatedData<Article>>(
        `/api/articles/all${buildQuery(filters)}`,
      ),
  });
}

export function useArticle(id: string) {
  const { data: articlesData, ...rest } = useArticles({ limit: 100 });
  const article = articlesData?.items?.find((a) => a.id === id);
  return { data: article, ...rest };
}

export function useCreateArticle() {

  const queryClient = useQueryClient();
  return useMutation<Article, ApiError, ArticleFormData>({
    mutationFn: (data) =>
      clientFetch<Article>("/api/articles", {
        method: "POST",
        body: JSON.stringify(serializeArticlePayload(data)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
}

export function useUpdateArticle(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Article, ApiError, Partial<ArticleFormData>>({
    mutationFn: (data) =>
      clientFetch<Article>(`/api/articles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(
          data.content
            ? serializeArticlePayload(data as ArticleFormData)
            : data,
        ),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
}


export function usePublishArticle() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { id: string; isPublished: boolean }>({
    mutationFn: ({ id, isPublished }) =>
      clientFetch<void>(`/api/articles/${id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/articles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
}
