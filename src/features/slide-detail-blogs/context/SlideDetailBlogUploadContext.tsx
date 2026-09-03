"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { uploadImage, type UploadResult } from "@/lib/upload";

interface SlideDetailBlogUploadContextValue {
  /** The target subfolder under /vdcd/slides (e.g. "bai-viet", "so-hoa-du-lieu") */
  subfolder: string;
  /** Uploads an image to the specific slide detail blog subfolder */
  uploadBlogImage: (file: File) => Promise<UploadResult>;
}

const SlideDetailBlogUploadContext = createContext<
  SlideDetailBlogUploadContextValue | undefined
>(undefined);

export interface SlideDetailBlogUploadProviderProps {
  /** Target subfolder under /vdcd/slides (e.g. slug of the article) */
  subfolder?: string;
  children: React.ReactNode;
}

/**
 * Provides context for slide detail blog image uploads so child components
 * (VisualEditor, PropertyPanel, BlockEditor) automatically upload images to
 * `/vdcd/slides/${subfolder}` without prop-drilling.
 */
export function SlideDetailBlogUploadProvider({
  subfolder = "detail-blogs",
  children,
}: SlideDetailBlogUploadProviderProps) {
  const cleanSubfolder = useMemo(() => {
    const trimmed = subfolder.trim();
    return trimmed || "detail-blogs";
  }, [subfolder]);

  const uploadBlogImage = useCallback(
    (file: File) => {
      return uploadImage(file, "slide-detail-blog", {
        subfolder: cleanSubfolder,
      });
    },
    [cleanSubfolder],
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
