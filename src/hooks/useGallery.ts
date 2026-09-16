"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { clientFetch } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────

export interface GalleryFile {
  fileId: string;
  name: string;
  url: string;
  filePath: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
  thumbnail: string;
  fileType?: string;
  mime?: string;
}

export interface GalleryFolder {
  name: string;
  folderPath: string;
}

interface GalleryFilesResponse {
  files: GalleryFile[];
}

interface GalleryFoldersResponse {
  folders: GalleryFolder[];
}

// ─── Predefined folders ──────────────────────────────────────

export const PRESET_FOLDERS = [
  { label: "Tất cả", path: "/vdcd", description: "Toàn bộ ảnh & tệp trên hệ thống" },
  { label: "Dự án", path: "/vdcd/projects", description: "Ảnh tư liệu dự án & sản phẩm" },
  { label: "Giải pháp", path: "/vdcd/solutions", description: "Ảnh các giải pháp chuyển đổi số" },
  { label: "Bài viết", path: "/vdcd/articles", description: "Ảnh minh họa bài viết tin tức" },
  { label: "Slides", path: "/vdcd/slides", description: "Slide trang chủ & banner" },
  { label: "Đối tác", path: "/vdcd/partners", description: "Logo đối tác & tổ chức" },
  { label: "Giới thiệu", path: "/vdcd/about-us", description: "Ảnh giới thiệu về chúng tôi" },
  { label: "Hình ảnh chung", path: "/vdcd/images", description: "Ảnh dùng chung & banners" },
  { label: "Logo", path: "/vdcd/logo", description: "Logo nhận diện thương hiệu" },
  { label: "Thumbnails", path: "/vdcd/thumbnails", description: "Ảnh đại diện, thu nhỏ" },
  { label: "Chương trình", path: "/vdcd/programs", description: "Ảnh các chương trình hành động" },
  { label: "Đính kèm", path: "/vdcd/attachments", description: "Tệp tải lên đính kèm, tài liệu PDF" },
] as const;

// ─── Date filter presets ─────────────────────────────────────

export type DateFilter = "all" | "today" | "7days" | "30days" | "90days" | "year";

export const DATE_FILTERS: { label: string; value: DateFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày", value: "7days" },
  { label: "30 ngày", value: "30days" },
  { label: "3 tháng", value: "90days" },
  { label: "1 năm", value: "year" },
];

export function getDateSearchQuery(filter: DateFilter): string | undefined {
  if (filter === "all") return undefined;
  const now = new Date();
  let from: Date;
  switch (filter) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7days":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30days":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90days":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return undefined;
  }
  return `createdAt >= "${from.toISOString()}"`;
}

// ─── Query keys ──────────────────────────────────────────────

export const galleryKeys = {
  all: ["gallery"] as const,
  files: (path: string, limit: number, searchQuery?: string, fileType?: string) =>
    [...galleryKeys.all, "files", path, limit, searchQuery ?? "", fileType ?? "all"] as const,
  folders: (path: string) =>
    [...galleryKeys.all, "folders", path] as const,
};

export const GALLERY_PAGE_SIZE = 30;

// ─── Hooks ───────────────────────────────────────────────────

/**
 * Infinite-scroll gallery images from ImageKit.
 * Each "page" fetches `GALLERY_PAGE_SIZE` items;
 * `getNextPageParam` returns the skip for the next page.
 */
export function useGalleryImagesInfinite(
  path: string,
  options?: {
    searchQuery?: string;
    fileType?: "all" | "image" | "non-image";
    enabled?: boolean;
    pageSize?: number;
  },
) {
  const pageSize = options?.pageSize ?? GALLERY_PAGE_SIZE;
  const { searchQuery, fileType = "all", enabled = true } = options ?? {};

  return useInfiniteQuery<GalleryFile[], Error>({
    queryKey: galleryKeys.files(path, pageSize, searchQuery, fileType),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        path,
        skip: String(pageParam),
        limit: String(pageSize),
        sort: "DESC_CREATED",
        fileType,
      });
      if (searchQuery) {
        params.set("searchQuery", searchQuery);
      }
      const res = await clientFetch<GalleryFilesResponse>(
        `/api/upload/gallery?${params.toString()}`,
      );
      return res.files;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.reduce((sum, p) => sum + p.length, 0);
    },
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Fetch subfolders under a given ImageKit path.
 */
export function useGalleryFolders(parentPath = "/vdcd", enabled = true) {
  return useQuery<GalleryFolder[]>({
    queryKey: galleryKeys.folders(parentPath),
    queryFn: async () => {
      const params = new URLSearchParams({ path: parentPath });
      const res = await clientFetch<GalleryFoldersResponse>(
        `/api/upload/gallery/folders?${params.toString()}`,
      );
      return res.folders;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * Delete a file from ImageKit by fileId.
 */
export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      return clientFetch(`/api/upload/${fileId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all });
    },
  });
}

