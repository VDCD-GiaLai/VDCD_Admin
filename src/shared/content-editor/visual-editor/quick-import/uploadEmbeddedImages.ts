/**
 * Image auto-uploader for Quick Import
 * Extracts base64, blob, and external Docs images from parsed blocks
 * and uploads them to ImageKit CDN via uploadImage().
 */

import { uploadImage } from "@/lib/upload";
import type { ContentBlock } from "../../model/document.types";
import type { ImageBlock } from "@/types/slide-detail-blog";

/**
 * Converts a base64 data URL to a browser File object
 */
export function dataUrlToFile(dataUrl: string, filename = "pasted-image.png"): File | null {
  try {
    const arr = dataUrl.split(",");
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const ext = mime.split("/")[1]?.replace("+xml", "") || "png";
    const safeFilename = filename.includes(".") ? filename : `${filename}.${ext}`;
    return new File([u8arr], safeFilename, { type: mime });
  } catch (err) {
    console.error("Failed to convert dataUrl to File:", err);
    return null;
  }
}

/**
 * Converts a blob URL or external URL to a browser File object
 */
export async function urlToFile(url: string, filename = "docs-image.png"): Promise<File | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = blob.type || "image/png";
    const ext = mime.split("/")[1]?.replace("+xml", "") || "png";
    const safeFilename = filename.includes(".") ? filename : `${filename}.${ext}`;
    return new File([blob], safeFilename, { type: mime });
  } catch {
    // CORS or network failure — fallback to retaining original URL
    return null;
  }
}

/**
 * Checks whether an image URL requires uploading to CDN
 */
export function isUploadCandidate(url: string): boolean {
  if (!url) return false;
  // Base64 data URLs
  if (url.startsWith("data:image/")) return true;
  // Browser blob URLs
  if (url.startsWith("blob:")) return true;
  // Google Docs hosted images (temporary CDN that expires)
  if (url.includes("googleusercontent.com") || url.includes("docs.google.com")) return true;
  return false;
}

export interface UploadProgressInfo {
  current: number;
  total: number;
  message?: string;
}

export interface UploadEmbeddedImagesResult {
  blocks: ContentBlock[];
  uploadedCount: number;
  errorCount: number;
}

/**
 * Iterates through blocks and uploads embedded/docs images to CDN.
 * Replaces image block URLs with permanent ImageKit CDN URLs and attaches fileId.
 */
export async function uploadEmbeddedImages(
  blocks: ContentBlock[],
  onProgress?: (info: UploadProgressInfo) => void,
): Promise<UploadEmbeddedImagesResult> {
  // Deep clone blocks to prevent direct mutation
  const clonedBlocks: ContentBlock[] = JSON.parse(JSON.stringify(blocks));

  // Count total images that need upload
  const uploadTasks: { blockIndex: number; isSecondary: boolean; url: string; caption?: string | null }[] = [];

  clonedBlocks.forEach((block, idx) => {
    if (block.type === "image") {
      const imgBlock = block as ImageBlock;
      if (imgBlock.url && isUploadCandidate(imgBlock.url)) {
        uploadTasks.push({ blockIndex: idx, isSecondary: false, url: imgBlock.url, caption: imgBlock.caption });
      }
      if (imgBlock.secondaryUrl && isUploadCandidate(imgBlock.secondaryUrl)) {
        uploadTasks.push({ blockIndex: idx, isSecondary: true, url: imgBlock.secondaryUrl, caption: imgBlock.secondaryCaption });
      }
    }
  });

  const total = uploadTasks.length;
  if (total === 0) {
    return { blocks: clonedBlocks, uploadedCount: 0, errorCount: 0 };
  }

  let uploadedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < total; i++) {
    const task = uploadTasks[i];
    onProgress?.({
      current: i + 1,
      total,
      message: `Đang tải lên ảnh ${i + 1}/${total}...`,
    });

    try {
      let file: File | null = null;
      const baseFilename = `doc-img-${Date.now()}-${i + 1}`;

      if (task.url.startsWith("data:image/")) {
        file = dataUrlToFile(task.url, `${baseFilename}.png`);
      } else if (task.url.startsWith("blob:") || isUploadCandidate(task.url)) {
        file = await urlToFile(task.url, `${baseFilename}.png`);
      }

      if (file) {
        const uploadRes = await uploadImage(file, "slide-detail-blog");
        const targetBlock = clonedBlocks[task.blockIndex] as ImageBlock;
        if (!task.isSecondary) {
          targetBlock.url = uploadRes.url;
          targetBlock.fileId = uploadRes.fileId;
        } else {
          targetBlock.secondaryUrl = uploadRes.url;
          targetBlock.secondaryFileId = uploadRes.fileId;
        }
        uploadedCount++;
      } else {
        // If file conversion failed (e.g. CORS on external image), keep original URL
        errorCount++;
      }
    } catch (err) {
      console.error(`Failed to upload embedded image #${i + 1}:`, err);
      errorCount++;
    }
  }

  return {
    blocks: clonedBlocks,
    uploadedCount,
    errorCount,
  };
}
