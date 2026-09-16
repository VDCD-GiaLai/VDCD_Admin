"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AppButton,
  useToast,
} from "@/components/ui";
import type { GalleryFile } from "@/hooks/useGallery";

interface MediaDetailModalProps {
  image: GalleryFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (image: GalleryFile) => void;
  canDelete?: boolean;
}

export function MediaDetailModal({
  image,
  isOpen,
  onClose,
  onDelete,
  canDelete,
}: MediaDetailModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!image) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      toast({ title: "Đã sao chép liên kết ảnh vào clipboard", color: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Không thể sao chép liên kết", color: "danger" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" placement="center">
      <ModalContent className="max-h-[90vh]">
        <ModalHeader>
          <div className="flex items-center gap-2 truncate pr-6">
            <span className="truncate text-base font-bold text-text">
              {image.name}
            </span>
          </div>
        </ModalHeader>

        <ModalBody className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* Left: Image preview */}
            <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-muted/40 p-2 md:col-span-7">
              <div className="relative max-h-[400px] w-full overflow-hidden rounded-lg flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.name}
                  className="max-h-[380px] w-auto object-contain"
                />
              </div>
            </div>

            {/* Right: Metadata details */}
            <div className="flex flex-col justify-between space-y-4 md:col-span-5">
              <div className="space-y-3 text-xs">
                <div>
                  <span className="block font-semibold text-text-muted">Tên tệp</span>
                  <span className="font-medium text-text break-all">{image.name}</span>
                </div>

                <div>
                  <span className="block font-semibold text-text-muted">Độ phân giải</span>
                  <span className="font-medium text-text">
                    {image.width && image.height
                      ? `${image.width} × ${image.height} px`
                      : "Không xác định"}
                  </span>
                </div>

                <div>
                  <span className="block font-semibold text-text-muted">Dung lượng</span>
                  <span className="font-medium text-text">{formatFileSize(image.size)}</span>
                </div>

                <div>
                  <span className="block font-semibold text-text-muted">Ngày tải lên</span>
                  <span className="font-medium text-text">{formatDate(image.createdAt)}</span>
                </div>

                <div>
                  <span className="block font-semibold text-text-muted">Đường dẫn tệp</span>
                  <span className="font-mono text-[11px] text-text break-all">{image.filePath}</span>
                </div>

                <div>
                  <span className="block font-semibold text-text-muted">ImageKit File ID</span>
                  <span className="font-mono text-[11px] text-text-muted break-all">{image.fileId}</span>
                </div>

                <div>
                  <span className="mb-1 block font-semibold text-text-muted">URL trực tiếp</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={image.url}
                      className="w-full rounded-md border border-border bg-surface-muted/40 px-2.5 py-1 font-mono text-[11px] text-text focus:outline-none"
                    />
                    <AppButton
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="shrink-0 text-xs"
                    >
                      {copied ? "Đã copy" : "Copy"}
                    </AppButton>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <AppButton variant="outline" size="sm" className="w-full">
                      Mở trong tab mới ↗
                    </AppButton>
                  </a>
                  <a
                    href={image.url}
                    download={image.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <AppButton variant="outline" size="sm" className="w-full">
                      Tải về máy ↓
                    </AppButton>
                  </a>
                </div>

                {canDelete && onDelete && (
                  <AppButton
                    variant="outline"
                    color="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      onClose();
                      onDelete(image);
                    }}
                  >
                    Xóa ảnh khỏi thư viện
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <AppButton variant="outline" size="sm" onClick={onClose}>
            Đóng
          </AppButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
