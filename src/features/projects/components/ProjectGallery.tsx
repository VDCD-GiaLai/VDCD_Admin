"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent } from "@heroui/react";
import { AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import {
  useUploadProjectImages,
  useReorderProjectImages,
  useDeleteProjectImage,
  useUpdateProjectImage,
} from "@/features/projects/api";
import type { ProjectImage } from "@/types/project";
import { validateImageFile } from "@/lib/upload";

// ─── Sortable Item Component ─────────────────────────────────

function SortableImageItem({
  image,
  onDelete,
  isDeleting,
  onUpdateCaption,
  onUpdateSize,
}: {
  image: ProjectImage;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onUpdateCaption: (id: string, caption: string) => void;
  onUpdateSize: (id: string, size: "small" | "large") => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const [captionValue, setCaptionValue] = useState(image.caption ?? "");
  const [prevCaption, setPrevCaption] = useState(image.caption);

  if (image.caption !== prevCaption) {
    setPrevCaption(image.caption);
    setCaptionValue(image.caption ?? "");
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const isLarge = image.size === "large";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col justify-between overflow-hidden rounded-lg border bg-surface transition-all ${
        isDragging
          ? "border-primary shadow-lg ring-2 ring-primary/20"
          : "border-border shadow-xs hover:border-border/80"
      } ${isLarge ? "col-span-1 sm:col-span-2" : "col-span-1"}`}
    >
      {/* Card Header Toolbar: Drag Handle + Size Controls + Delete Button */}
      <div className="flex items-center justify-between border-b border-border/60 bg-surface-muted/40 px-2.5 py-1.5 text-xs">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center gap-1 text-text-muted hover:text-text active:cursor-grabbing"
          title="Kéo để sắp xếp thứ tự ảnh"
        >
          <span className="text-base leading-none">⋮⋮</span>
          <span className="text-[11px] font-medium hidden sm:inline">Kéo</span>
        </div>

        {/* Size Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-text-muted hidden md:inline">Cỡ:</span>
          <div className="inline-flex rounded-md border border-border bg-surface p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => onUpdateSize(image.id, "small")}
              className={`rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
                !isLarge
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-text"
              }`}
              title="Kích thước thường (1 cột)"
            >
              Nhỏ
            </button>
            <button
              type="button"
              onClick={() => onUpdateSize(image.id, "large")}
              className={`rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
                isLarge
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-text"
              }`}
              title="Kích thước rộng (2 cột)"
            >
              Lớn
            </button>
          </div>

          {/* Delete Button */}
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(image.id)}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed cursor-pointer"
            title="Xoá ảnh này"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Image Preview */}
      <div className="relative overflow-hidden bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.caption ?? "Project image"}
          className={`w-full object-cover transition-transform group-hover:scale-102 ${
            isLarge ? "h-52 sm:h-64" : "h-36 sm:h-44"
          }`}
        />
      </div>

      {/* Caption Input Field */}
      <div className="border-t border-border/60 bg-surface p-2.5">
        <label className="block text-[10px] font-semibold text-text-muted mb-1">
          Chú thích ảnh:
        </label>
        <input
          type="text"
          placeholder="Nhập chú thích (caption)..."
          value={captionValue}
          onChange={(e) => setCaptionValue(e.target.value)}
          onBlur={() => {
            if (captionValue !== (image.caption ?? "")) {
              onUpdateCaption(image.id, captionValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="w-full rounded-md border border-border bg-surface-muted/30 px-2.5 py-1 text-xs text-text placeholder:text-text-muted/60 focus:border-primary focus:bg-surface focus:outline-none"
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export interface ProjectGalleryProps {
  projectId?: string | null;
  images: ProjectImage[];
  onUpdateCache: (newImages: ProjectImage[]) => void;
}

/**
 * PHASE 14 — Gallery Architecture & UI
 * Features:
 * - upload: add multiple images into gallery
 * - reorder: drag-and-drop sortable items with persistent order
 * - caption: inline caption editor per image
 * - size: toggle 'small' vs 'large' display size
 * - delete: remove image from gallery
 */
export function ProjectGallery({
  projectId,
  images,
  onUpdateCache,
}: ProjectGalleryProps) {
  const { toast } = useToast();
  const uploadMutation = useUploadProjectImages(projectId ?? "");
  const reorderMutation = useReorderProjectImages(projectId ?? "");
  const deleteMutation = useDeleteProjectImage(projectId ?? "");
  const updateMutation = useUpdateProjectImage(projectId ?? "");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ── Handlers ────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (!projectId) {
      toast({
        title: "Chưa lưu dự án",
        description:
          "Vui lòng lưu thông tin dự án trước khi tải ảnh vào thư viện Gallery.",
        color: "warning",
      });
      return;
    }

    if (files.length + images.length > 20) {
      toast({ title: "Tối đa 20 ảnh", color: "warning" });
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateImageFile(file);
      if (error) {
        toast({
          title: `File ${file.name} không hợp lệ`,
          description: error,
          color: "danger",
        });
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      uploadMutation.mutate(
        { files: validFiles },
        {
          onSuccess: (newImages) => {
            toast({ title: "Tải ảnh thành công", color: "success" });
            onUpdateCache([...images, ...newImages]);
            e.target.value = "";
          },
          onError: (error) => {
            toast({
              title: "Tải ảnh thất bại",
              description: error.message,
              color: "danger",
            });
          },
        },
      );
    }
  };

  const handleDelete = useCallback(
    (imageId: string) => {
      if (!confirm("Xoá ảnh này khỏi thư viện?")) return;

      if (!projectId) {
        onUpdateCache(images.filter((img) => img.id !== imageId));
        toast({ title: "Đã xoá ảnh", color: "success" });
        return;
      }

      setDeletingId(imageId);
      deleteMutation.mutate(imageId, {
        onSuccess: () => {
          toast({ title: "Đã xoá ảnh", color: "success" });
          onUpdateCache(images.filter((img) => img.id !== imageId));
        },
        onError: (err) => {
          toast({
            title: "Xoá thất bại",
            description: err.message,
            color: "danger",
          });
        },
        onSettled: () => setDeletingId(null),
      });
    },
    [deleteMutation, images, onUpdateCache, projectId, toast],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    const newImages = arrayMove(images, oldIndex, newIndex).map(
      (img, idx) => ({
        ...img,
        order: idx,
      }),
    );

    // Update local state immediately (Optimistic UI)
    onUpdateCache(newImages);

    if (projectId) {
      // Sync to backend
      const payload = newImages.map((img, idx) => ({
        id: img.id,
        order: idx,
      }));
      reorderMutation.mutate(payload, {
        onError: (err) => {
          toast({
            title: "Lỗi lưu vị trí",
            description: err.message,
            color: "danger",
          });
          onUpdateCache(images);
        },
      });
    }
  };

  // Caption update handler
  const handleUpdateCaption = useCallback(
    (imageId: string, caption: string) => {
      const updated = images.map((img) =>
        img.id === imageId ? { ...img, caption } : img,
      );
      onUpdateCache(updated);

      if (projectId) {
        updateMutation.mutate(
          { imageId, caption },
          {
            onError: (err) => {
              const isNotFound =
                err.message?.includes("Cannot PATCH") ||
                err.message?.includes("404") ||
                err.status === 404;

              if (isNotFound) {
                toast({
                  title: "Đã lưu chú thích trên giao diện",
                  description:
                    "Chú thích ảnh đã cập nhật (Backend cần bổ sung endpoint PATCH ảnh để lưu vĩnh viễn vào DB).",
                  color: "warning",
                });
              } else {
                toast({
                  title: "Lỗi cập nhật chú thích",
                  description: err.message,
                  color: "danger",
                });
                onUpdateCache(images);
              }
            },
          },
        );
      }
    },
    [images, onUpdateCache, projectId, updateMutation, toast],
  );

  // Size toggle handler ('small' | 'large')
  const handleUpdateSize = useCallback(
    (imageId: string, size: "small" | "large") => {
      const updated = images.map((img) =>
        img.id === imageId ? { ...img, size } : img,
      );
      onUpdateCache(updated);

      if (projectId) {
        updateMutation.mutate(
          { imageId, size },
          {
            onError: (err) => {
              const isNotFound =
                err.message?.includes("Cannot PATCH") ||
                err.message?.includes("404") ||
                err.status === 404;

              if (isNotFound) {
                toast({
                  title: "Đã đổi kích thước trên giao diện",
                  description:
                    "Kích thước hiển thị đã đổi (Backend cần bổ sung endpoint PATCH ảnh để lưu vĩnh viễn vào DB).",
                  color: "warning",
                });
              } else {
                toast({
                  title: "Lỗi cập nhật kích thước",
                  description: err.message,
                  color: "danger",
                });
                onUpdateCache(images);
              }
            },
          },
        );
      }
    },
    [images, onUpdateCache, projectId, updateMutation, toast],
  );

  // ── Render ──────────────────────────────────────────────────

  return (
    <Card className="border border-border bg-surface shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <CardTitle className="text-base font-semibold text-text">
            Thư viện ảnh dự án (Gallery)
          </CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Quản lý danh sách ảnh, chú thích, kích thước hiển thị và thứ tự sắp
            xếp.
          </p>
        </div>
        <div className="relative overflow-hidden">
          <AppButton size="sm" isLoading={uploadMutation.isPending}>
            + Tải ảnh lên
          </AppButton>
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileChange}
            disabled={uploadMutation.isPending}
            title="Tải lên tối đa 20 ảnh"
          />
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted/30 py-12 text-center">
            <span className="text-3xl mb-2">🖼️</span>
            <p className="text-sm font-medium text-text">
              Chưa có ảnh nào trong thư viện Gallery
            </p>
            <p className="text-xs text-text-muted mt-1 max-w-sm">
              Nhấn &ldquo;+ Tải ảnh lên&rdquo; để thêm ảnh minh hoạ thực tế cho
              dự án. Bạn có thể thay đổi chú thích, chỉnh kích cỡ và kéo thả sắp
              xếp.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {images.map((img) => (
                  <SortableImageItem
                    key={img.id}
                    image={img}
                    onDelete={handleDelete}
                    isDeleting={deletingId === img.id}
                    onUpdateCaption={handleUpdateCaption}
                    onUpdateSize={handleUpdateSize}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-text-muted">
          <span>
            💡 Kéo thanh <b>⋮⋮ Kéo</b> để sắp xếp thứ tự. Chọn <b>Nhỏ</b> (1
            cột) hoặc <b>Lớn</b> (2 cột) để định dạng bài đọc.
          </span>
          <span>
            {images.length}/20 ảnh · Định dạng JPG, PNG, WebP (tối đa 10MB/ảnh)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
