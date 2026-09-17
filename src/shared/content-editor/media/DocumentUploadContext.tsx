"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { uploadImage, type UploadResult, type UploadFolder } from "@/lib/upload";

export interface DocumentUploadContextValue {
  /** The target subfolder (e.g. slug of the article or program) */
  subfolder: string;
  /** The upload folder type (e.g. "slide-detail-blog", "program", "article", "project") */
  folder: UploadFolder;
  /** Uploads an image to the specific subfolder */
  uploadDocumentImage: (file: File) => Promise<UploadResult>;
}

const DocumentUploadContext = createContext<
  DocumentUploadContextValue | undefined
>(undefined);

export interface DocumentUploadProviderProps {
  /** Target subfolder (e.g. slug of the article/program/project) */
  subfolder?: string;
  /** Target upload folder (e.g., "slide-detail-blog", "article", "image", "thumbnail", "project") */
  folder?: UploadFolder;
  /** Optional temporary stable folder key before slug exists (e.g. "project-a8f31c") */
  tempFolderKey?: string;
  children: React.ReactNode;
}

/**
 * Provides upload context so child editor components (VisualEditor, PropertyPanel, BlockEditor)
 * upload images automatically to the correct entity folder & subfolder without prop drilling.
 */
export function DocumentUploadProvider({
  subfolder = "content-media",
  folder = "image",
  tempFolderKey,
  children,
}: DocumentUploadProviderProps) {
  const cleanSubfolder = useMemo(() => {
    const trimmed = subfolder?.trim() ?? "";
    if (trimmed) return trimmed;
    return folder === "article" ||
      folder === "program" ||
      folder === "solution" ||
      folder === "project"
      ? ""
      : "content-media";
  }, [subfolder, folder]);

  const uploadDocumentImage = useCallback(
    (file: File) => {
      return uploadImage(file, folder, {
        subfolder: cleanSubfolder || undefined,
        slug: cleanSubfolder || undefined,
        tempFolderKey:
          tempFolderKey?.trim() ||
          (folder === "project" ? cleanSubfolder || undefined : undefined),
      });
    },
    [cleanSubfolder, folder, tempFolderKey],
  );

  const value = useMemo(
    () => ({
      subfolder: cleanSubfolder,
      folder,
      uploadDocumentImage,
    }),
    [cleanSubfolder, folder, uploadDocumentImage],
  );

  return (
    <DocumentUploadContext.Provider value={value}>
      {children}
    </DocumentUploadContext.Provider>
  );
}

/**
 * Hook to access current document upload context.
 */
export function useDocumentUpload() {
  const context = useContext(DocumentUploadContext);

  const fallbackUpload = useCallback((file: File) => {
    return uploadImage(file, "image", {
      subfolder: "content-media",
    });
  }, []);

  if (!context) {
    return {
      subfolder: "content-media",
      folder: "image" as UploadFolder,
      uploadDocumentImage: fallbackUpload,
    };
  }

  return context;
}
