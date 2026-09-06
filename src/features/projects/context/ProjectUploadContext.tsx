"use client";

import React, { createContext, useContext, useCallback, useMemo, useState } from "react";
import { uploadImage, type UploadResult, type UploadImageOptions } from "@/lib/upload";

export interface ProjectUploadContextValue {
  /**
   * The stable folder key for the entire project editing/creation session.
   * Format: either existing slug (e.g. "smart-city-gia-lai")
   * or stable temporary session key (e.g. "project-a8f31c").
   */
  sessionFolderKey: string;

  /**
   * Upload an image associated with this project (thumbnail, challenge, before/after, gallery, or content).
   * Automatically routes into `/vdcd/projects/${sessionFolderKey}/`.
   */
  uploadProjectImage: (
    file: File,
    options?: Partial<UploadImageOptions>,
  ) => Promise<UploadResult>;
}

const ProjectUploadContext = createContext<ProjectUploadContextValue | undefined>(
  undefined,
);

export interface ProjectUploadProviderProps {
  /**
   * If editing an existing project, pass its slug.
   * If creating a new project, leave undefined to generate a stable temporary session key.
   */
  initialSlug?: string | null;
  children: React.ReactNode;
}

/**
 * Generates a stable fallback key: `project-${randomHex}`
 */
export function generateProjectSessionKey(): string {
  return `project-${Math.random().toString(36).substring(2, 8)}`;
}

export function ProjectUploadProvider({
  initialSlug,
  children,
}: ProjectUploadProviderProps) {
  // Stable key across entire lifetime of this provider mount
  const [sessionFolderKey] = useState<string>(() => {
    const trimmed = initialSlug?.trim();
    if (trimmed) return trimmed;
    return generateProjectSessionKey();
  });

  const uploadProjectImage = useCallback(
    async (
      file: File,
      options?: Partial<UploadImageOptions>,
    ): Promise<UploadResult> => {
      return uploadImage(file, "project", {
        subfolder: sessionFolderKey,
        slug: sessionFolderKey,
        tempFolderKey: sessionFolderKey,
        ...options,
      });
    },
    [sessionFolderKey],
  );

  const value = useMemo(
    () => ({
      sessionFolderKey,
      uploadProjectImage,
    }),
    [sessionFolderKey, uploadProjectImage],
  );

  return (
    <ProjectUploadContext.Provider value={value}>
      {children}
    </ProjectUploadContext.Provider>
  );
}

/**
 * Hook to access the current project upload session.
 */
export function useProjectUploadSession(): ProjectUploadContextValue {
  const context = useContext(ProjectUploadContext);
  if (!context) {
    // Fallback if rendered outside provider
    const fallbackKey = "project-default";
    return {
      sessionFolderKey: fallbackKey,
      uploadProjectImage: (file: File, options?: Partial<UploadImageOptions>) =>
        uploadImage(file, "project", {
          subfolder: fallbackKey,
          slug: fallbackKey,
          tempFolderKey: fallbackKey,
          ...options,
        }),
    };
  }
  return context;
}
