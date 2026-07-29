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
import { AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import {
  useUploadProjectImages,
  useReorderProjectImages,
  useDeleteProjectImage,
} from "@/features/projects/api";
import type { ProjectImage } from "@/types/project";
import { validateImageFile } from "@/lib/upload";

// ─── Sortable Item Component ─────────────────────────────────

function SortableImageItem({
  image,
  onDelete,
  isDeleting,
}: {
  image: ProjectImage;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-md border bg-surface ${
        isDragging ? "border-primary shadow-md" : "border-border shadow-sm"
      }`}
    >
      <div
        className="absolute inset-0 z-10 cursor-move bg-black/0 transition-colors group-hover:bg-black/10"
        {...attributes}
        {...listeners}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.caption ?? "Project image"}
        className="h-32 w-full object-cover"
      />
      
      {/* Delete Button */}
      <button
        type="button"
        disabled={isDeleting}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(image.id);
        }}
        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export interface ProjectGalleryProps {
  projectId: string;
  images: ProjectImage[];
  onUpdateCache: (newImages: ProjectImage[]) => void;
}

export function ProjectGallery({ projectId, images, onUpdateCache }: ProjectGalleryProps) {
  const { toast } = useToast();
  const uploadMutation = useUploadProjectImages(projectId);
  const reorderMutation = useReorderProjectImages(projectId);
  const deleteMutation = useDeleteProjectImage(projectId);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Handlers ────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (files.length + images.length > 20) {
      toast({ title: "Tối đa 20 ảnh", color: "warning" });
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateImageFile(file);
      if (error) {
        toast({ title: `File ${file.name} không hợp lệ`, description: error, color: "danger" });
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
            // API returns new images, append to local cache
            onUpdateCache([...images, ...newImages]);
            e.target.value = ""; // reset input
          },
          onError: (error) => {
            toast({ title: "Tải ảnh thất bại", description: error.message, color: "danger" });
          },
        }
      );
    }
  };

  const handleDelete = useCallback((imageId: string) => {
    if (!confirm("Xoá ảnh này?")) return;
    setDeletingId(imageId);
    deleteMutation.mutate(imageId, {
      onSuccess: () => {
        toast({ title: "Đã xoá ảnh", color: "success" });
        onUpdateCache(images.filter((img) => img.id !== imageId));
      },
      onError: (err) => {
        toast({ title: "Xoá thất bại", description: err.message, color: "danger" });
      },
      onSettled: () => setDeletingId(null),
    });
  }, [deleteMutation, images, onUpdateCache, toast]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    const newImages = arrayMove(images, oldIndex, newIndex);
    // Update local state immediately (Optimistic UI)
    onUpdateCache(newImages);

    // Sync to backend
    const payload = newImages.map((img, idx) => ({ id: img.id, order: idx }));
    reorderMutation.mutate(payload, {
      onError: (err) => {
        toast({ title: "Lỗi lưu vị trí", description: err.message, color: "danger" });
        // Revert on error
        onUpdateCache(images);
      },
    });
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <Card className="border border-border bg-surface shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-3.5">
        <CardTitle className="text-base font-semibold text-text">Thư viện ảnh</CardTitle>
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
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-surface-muted/50 text-sm text-text-muted">
            Chưa có ảnh nào trong thư viện
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {images.map((img) => (
                  <SortableImageItem
                    key={img.id}
                    image={img}
                    onDelete={handleDelete}
                    isDeleting={deletingId === img.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <p className="mt-3 text-xs text-text-muted">
          Kéo thả để sắp xếp thứ tự ảnh. Định dạng JPG, PNG, WebP. Tối đa 5MB/ảnh và tổng 20 ảnh.
        </p>
      </CardContent>
    </Card>
  );
}
