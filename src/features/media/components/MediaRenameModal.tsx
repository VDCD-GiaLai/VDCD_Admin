"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AppButton,
  FormInput,
  FormCheckbox,
  Spinner,
  useToast,
} from "@/components/ui";
import { useRenameGalleryImage, type GalleryFile } from "@/hooks/useGallery";

interface MediaRenameModalProps {
  image: GalleryFile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: {
    fileId: string;
    name: string;
    filePath: string;
    url: string;
  }) => void;
}

/**
 * Cleanly slugify a filename base (Vietnamese accent removal, kebab-case)
 */
function slugifyFileName(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-") // Replace special chars with hyphen
    .replace(/-+/g, "-") // Remove duplicate hyphens
    .replace(/^-|-$/g, ""); // Trim edge hyphens
}

export function MediaRenameModal({
  image,
  isOpen,
  onClose,
  onSuccess,
}: MediaRenameModalProps) {
  const { toast } = useToast();
  const renameMutation = useRenameGalleryImage();

  // Extract base name and extension
  const { initialBaseName, fileExt, folderPath } = useMemo(() => {
    if (!image) return { initialBaseName: "", fileExt: "", folderPath: "" };
    const lastDot = image.name.lastIndexOf(".");
    const ext = lastDot > 0 ? image.name.slice(lastDot) : "";
    const base = lastDot > 0 ? image.name.slice(0, lastDot) : image.name;

    const lastSlash = image.filePath.lastIndexOf("/");
    const folder = lastSlash >= 0 ? image.filePath.slice(0, lastSlash) : "";

    return { initialBaseName: base, fileExt: ext, folderPath: folder };
  }, [image]);

  const [baseName, setBaseName] = useState("");
  const [syncDb, setSyncDb] = useState(true);

  // Sync state when image opens
  useEffect(() => {
    if (isOpen && image) {
      setBaseName(initialBaseName);
      setSyncDb(true);
    }
  }, [isOpen, image, initialBaseName]);

  if (!image) return null;

  const sanitizedBase = slugifyFileName(baseName);
  const targetFullName = `${sanitizedBase}${fileExt}`;
  const isUnchanged = targetFullName === image.name;
  const isInvalid = !sanitizedBase;

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid || isUnchanged || renameMutation.isPending) return;

    try {
      const res = await renameMutation.mutateAsync({
        fileId: image.fileId,
        newFileName: targetFullName,
        syncDatabaseReferences: syncDb,
      });

      const updatedCount = res.updatedDbRecordsCount ?? 0;
      toast({
        title: "Đổi tên tệp thành công",
        description:
          updatedCount > 0
            ? `Tệp đã đổi thành "${res.name}" và đồng bộ ${updatedCount} liên kết trong hệ thống.`
            : `Tệp đã đổi thành "${res.name}" trên ImageKit.`,
        color: "success",
      });

      onSuccess?.(res);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể đổi tên tệp. Vui lòng thử lại.";
      toast({
        title: "Đổi tên thất bại",
        description: msg,
        color: "danger",
      });
    }
  };

  const isDoc =
    image.fileType === "non-image" ||
    Boolean(image.name.match(/\.(pdf|docx?|xlsx?|pptx?|zip|rar|txt)$/i));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" placement="center">
      <ModalContent>
        <form onSubmit={handleRename}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-text">
                Đổi tên tệp tin
              </span>
            </div>
          </ModalHeader>

          <ModalBody className="space-y-4 p-5">
            {/* File info card */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/30 p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-muted">
                {isDoc ? (
                  <span className="text-xs font-bold uppercase text-text-muted">
                    {fileExt.replace(".", "") || "FILE"}
                  </span>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image.thumbnail || image.url}
                    alt={image.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Tên hiện tại
                </span>
                <p className="truncate text-xs font-medium text-text">
                  {image.name}
                </p>
                <p className="truncate font-mono text-[10px] text-text-muted">
                  {image.filePath}
                </p>
              </div>
            </div>

            {/* Input with fixed extension pill */}
            <div>
              <label
                htmlFor="rename-input"
                className="mb-1.5 block text-xs font-semibold text-text"
              >
                Tên tệp mới
              </label>
              <div className="flex items-center rounded-lg border border-border bg-surface shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <input
                  id="rename-input"
                  type="text"
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  placeholder="nhap-ten-tep-moi"
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-text placeholder:text-text-muted/60 focus:outline-none"
                />
                {fileExt && (
                  <span className="mr-2 select-none rounded-md bg-surface-muted px-2 py-1 font-mono text-[11px] font-semibold text-text-muted">
                    {fileExt}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-text-muted">
                Hệ thống tự động chuẩn hóa tiếng Việt thành dạng chữ thường không
                dấu (slug) để đảm bảo URL an toàn.
              </p>
            </div>

            {/* Live Preview */}
            <div className="rounded-lg border border-border/80 bg-surface-muted/20 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Xem trước đường dẫn mới
              </span>
              <p className="mt-1 truncate font-mono text-[11px] text-primary">
                {folderPath}/{targetFullName || "..."}
              </p>
            </div>

            {/* Database Sync Option */}
            <div className="rounded-lg border border-border p-3">
              <FormCheckbox
                checked={syncDb}
                onChange={(e) => setSyncDb(e.target.checked)}
                label="Đồng bộ liên kết trong CSDL"
              />
              <p className="mt-1 pl-6 text-[11px] text-text-muted">
                Tự động cập nhật đường dẫn ảnh mới trong tất cả Bài viết, Dự án,
                Slide, Banner đang chèn ảnh này.
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={renameMutation.isPending}
            >
              Hủy
            </AppButton>
            <AppButton
              type="submit"
              variant="solid"
              color="primary"
              size="sm"
              disabled={isInvalid || isUnchanged || renameMutation.isPending}
            >
              {renameMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-1.5" />
                  Đang đổi tên...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </AppButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
