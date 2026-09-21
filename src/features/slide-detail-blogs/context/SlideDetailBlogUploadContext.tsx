"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { uploadImage, type UploadResult, type UploadFolder } from "@/lib/upload";

interface SlideDetailBlogUploadContextValue {
  /** The target subfolder (e.g. slug of the article or slide) */
  subfolder: string;
  /** Target upload folder (default: "slide-detail-blog", or "article") */
  folder?: UploadFolder;
  /** Uploads an image to the specific subfolder */
  uploadBlogImage: (file: File) => Promise<UploadResult>;
  /** Notifies parent page when an image is selected from gallery to protect from ImageKit deletion */
  onGalleryFileSelect?: (fileId: string) => void;
}

const SlideDetailBlogUploadContext = createContext<
  SlideDetailBlogUploadContextValue | undefined
>(undefined);

export interface SlideDetailBlogUploadProviderProps {
  /** Target subfolder (e.g. slug of the article) */
  subfolder?: string;
  /** Target upload folder (default: "slide-detail-blog", or "article") */
  folder?: UploadFolder;
  /** Notifies parent page when an image is selected from gallery */
  onGalleryFileSelect?: (fileId: string) => void;
  children: React.ReactNode;
}

/**
 * Provides context for blog / article image uploads so child components
 * (VisualEditor, PropertyPanel, BlockEditor) automatically upload images to
 * the correct subfolder without prop-drilling.
 */
export function SlideDetailBlogUploadProvider({
  subfolder = "detail-blogs",
  folder = "slide-detail-blog",
  onGalleryFileSelect,
  children,
}: SlideDetailBlogUploadProviderProps) {
  const cleanSubfolder = useMemo(() => {
    const trimmed = subfolder?.trim() ?? "";
    if (trimmed) return trimmed;
    return folder === "article" ? "" : "detail-blogs";
  }, [subfolder, folder]);

  const uploadBlogImage = useCallback(
    (file: File) => {
      return uploadImage(file, folder, {
        subfolder: cleanSubfolder || undefined,
        slug: cleanSubfolder || undefined,
      });
    },
    [cleanSubfolder, folder],
  );

  const value = useMemo(
    () => ({
      subfolder: cleanSubfolder,
      folder,
      uploadBlogImage,
      onGalleryFileSelect,
    }),
    [cleanSubfolder, folder, uploadBlogImage, onGalleryFileSelect],
  );

  return (
    <SlideDetailBlogUploadContext.Provider value={value}>
      {children}
    </SlideDetailBlogUploadContext.Provider>
  );
}

/**
 * Hook to access the current slide detail blog upload context.
 * Falls back safely to default upload if used outside a provider.
 */
export function useSlideDetailBlogUpload() {
  const context = useContext(SlideDetailBlogUploadContext);

  const fallbackUpload = useCallback((file: File) => {
    return uploadImage(file, "slide-detail-blog", {
      subfolder: "detail-blogs",
    });
  }, []);

  if (!context) {
    return {
      subfolder: "detail-blogs",
      folder: "slide-detail-blog" as UploadFolder,
      uploadBlogImage: fallbackUpload,
    };
  }

  return context;
}
