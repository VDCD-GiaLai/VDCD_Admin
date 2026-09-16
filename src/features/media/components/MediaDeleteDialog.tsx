"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AppButton,
  Spinner,
} from "@/components/ui";
import type { GalleryFile } from "@/hooks/useGallery";

interface MediaDeleteDialogProps {
  image: GalleryFile | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function MediaDeleteDialog({
  image,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: MediaDeleteDialogProps) {
  if (!image) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" placement="center">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2 text-danger">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <span>Xác nhận xóa ảnh</span>
          </div>
        </ModalHeader>

        <ModalBody className="p-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/30 p-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumbnail || image.url}
                alt={image.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-text">
                {image.name}
              </p>
              <p className="truncate font-mono text-[10px] text-text-muted">
                {image.filePath}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-text-muted">
            Hành động này sẽ xóa vĩnh viễn tệp ảnh khỏi kho lưu trữ ImageKit. Các bài viết hoặc thành phần đang sử dụng liên kết ảnh này có thể bị mất hình ảnh.
          </p>
        </ModalBody>

        <ModalFooter>
          <AppButton variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </AppButton>
          <AppButton
            variant="solid"
            color="danger"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-1.5" />
                Đang xóa...
              </>
            ) : (
              "Xóa vĩnh viễn"
            )}
          </AppButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
