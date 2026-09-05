"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { uploadImage, type UploadResult, type UploadFolder } from "@/lib/upload";

interface SlideDetailBlogUploadContextValue {
  /** The target subfolder (e.g. slug of the article or slide) */
  subfolder: string;
  /** Uploads an image to the specific subfolder */
  uploadBlogImage: (file: File) => Promise<UploadResult>;
}

const SlideDetailBlogUploadContext = createContext<
  SlideDetailBlogUploadContextValue | undefined
>(undefined);

export interface SlideDetailBlogUploadProviderProps {
  /** Target subfolder (e.g. slug of the article) */
  subfolder?: string;
  /** Target upload folder (default: "slide-detail-blog", or "article") */
  folder?: UploadFolder;
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
      uploadBlogImage,
    }),
    [cleanSubfolder, uploadBlogImage],
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
      uploadBlogImage: fallbackUpload,
    };
  }

  return context;
}
