"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppButton, Spinner, Badge } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import {
  useSlides, useDeleteSlide, useToggleSlide, useReorderSlides, slideKeys,
} from "@/features/slides/api";
import { useSlideDetailBlogs } from "@/features/slide-detail-blogs/api";
import { TablePagination } from "@/components/shared";
import { useQueryClient } from "@tanstack/react-query";
import { usePermission } from "@/hooks/usePermission";
import type { Slide } from "@/types/slide";

// ─── Sortable row ────────────────────────────────────────────

function SortableSlideRow({
  slide, hasBlog, onEdit, onManageBlog, onDelete, onToggle, canDelete,
}: {
  slide: Slide;
  hasBlog: boolean;
  onEdit: () => void;
  onManageBlog: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
  canDelete: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border bg-surface transition-colors hover:bg-surface-muted/50">
      <td className="w-10 px-3 py-2.5">
        <button type="button" className="cursor-grab text-text-muted active:cursor-grabbing" {...attributes} {...listeners}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
          </svg>
        </button>
      </td>
      <td className="w-28 px-3 py-2.5">
        <div className="h-14 w-24 overflow-hidden rounded-md border border-border bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.imageUrl} alt={slide.title} className="h-full w-full object-cover" />
        </div>
      </td>
      <td className="px-3 py-2.5">
        <p className="font-medium text-text">{slide.title}</p>
        {slide.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{slide.description}</p>
        )}
      </td>
      <td className="px-3 py-2.5 text-sm text-text-muted">
        {slide.ctaText ? (
          <span className="inline-flex items-center gap-1">
            <Badge variant="soft" color="primary">{slide.ctaText}</Badge>
          </span>
        ) : "—"}
      </td>
      <td className="px-3 py-2.5 text-center">
        <button type="button" onClick={() => onToggle(!slide.isActive)} className="inline-flex">
          <Badge color={slide.isActive ? "success" : "secondary"} variant="soft">
            {slide.isActive ? "Hiển thị" : "Ẩn"}
          </Badge>
        </button>
      </td>
      <td className="px-3 py-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              hasBlog
                ? "text-purple-600 hover:bg-purple-50"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
            aria-label="Quản lý bài viết chi tiết"
            title={hasBlog ? "Chỉnh sửa bài viết chi tiết" : "Tạo bài viết chi tiết"}
            onClick={onManageBlog}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z" />
            </svg>
          </button>
          <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10" aria-label="Sửa" onClick={onEdit}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
          {canDelete && (
            <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10" aria-label="Xoá" onClick={onDelete}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main page ───────────────────────────────────────────────

/**
 * Slides list page — UC-SLD-01.
 * Features: DnD reorder, toggle active, CRUD.
 */
export default function SlidesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: slides, isLoading } = useSlides();
  const { data: blogsData } = useSlideDetailBlogs({ limit: 100 });
  const deleteMutation = useDeleteSlide();
  const toggleMutation = useToggleSlide();
  const reorderMutation = useReorderSlides();
  const canCreate = usePermission("slides:create");
  const canDelete = usePermission("slides:delete");
  const queryClient = useQueryClient();

  const blogsBySlideId = useMemo(() => {
    const map = new Map<string, string>();
    blogsData?.items?.forEach((b) => {
      map.set(b.slideId, b.id);
    });
    return map;
  }, [blogsData]);

  const [deleteTarget, setDeleteTarget] = useState<Slide | null>(null);
  const [localOrder, setLocalOrder] = useState<Slide[] | null>(null);

  const sortedSlides = useMemo(
    () => localOrder ?? (slides ? [...slides].sort((a, b) => a.order - b.order) : []),
    [localOrder, slides],
  );

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const paginatedSlides = useMemo(() => {
    return sortedSlides.slice((page - 1) * limit, page * limit);
  }, [sortedSlides, page, limit]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = [...sortedSlides];
    const oldIdx = items.findIndex((s) => s.id === active.id);
    const newIdx = items.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);

    setLocalOrder(reordered);
    const payload = reordered.map((s, i) => ({ id: s.id, order: i }));
    reorderMutation.mutate(payload, {
      onSuccess: () => { 
        queryClient.setQueryData(slideKeys.list(), reordered);
        setLocalOrder(null); 
        toast({ title: "Đã sắp xếp lại", color: "success" }); 
      },
      onError: (error) => { setLocalOrder(null); toast({ title: "Sắp xếp thất bại", description: error.message, color: "danger" }); },
    });
  }, [sortedSlides, reorderMutation, toast, queryClient]);

  const handleToggle = useCallback((id: string, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive }, {
      onSuccess: () => toast({ title: isActive ? "Đã hiển thị" : "Đã ẩn", color: "success" }),
      onError: (error) => toast({ title: "Thao tác thất bại", description: error.message, color: "danger" }),
    });
  }, [toggleMutation, toast]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => { toast({ title: "Đã xoá", color: "success" }); setDeleteTarget(null); },
      onError: (error) => toast({ title: "Xoá thất bại", description: error.message, color: "danger" }),
    });
  }, [deleteTarget, deleteMutation, toast]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">Slide</h1>
            <p className="text-sm text-text-muted">Quản lý slideshow trang chủ. Kéo thả để sắp xếp.</p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/slides/new")}>+ Thêm slide</AppButton>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={paginatedSlides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50">
                    <th className="w-10 px-3 py-2.5" />
                    <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted">Ảnh</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted">Tiêu đề</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted">CTA</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-text-muted">Trạng thái</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-text-muted">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSlides.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-sm text-text-muted">Chưa có slide nào</td></tr>
                  ) : (
                    paginatedSlides.map((slide) => {
                      const blogId = blogsBySlideId.get(slide.id);
                      return (
                        <SortableSlideRow
                          key={slide.id}
                          slide={slide}
                          hasBlog={!!blogId}
                          onEdit={() => router.push(`/slides/${slide.id}`)}
                          onManageBlog={() => {
                            if (blogId) {
                              router.push(`/slide-detail-blogs/${blogId}`);
                            } else {
                              router.push(`/slide-detail-blogs/new?slideId=${slide.id}`);
                            }
                          }}
                          onDelete={() => setDeleteTarget(slide)}
                          onToggle={(isActive) => handleToggle(slide.id, isActive)}
                          canDelete={canDelete}
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>

        {sortedSlides.length > 0 && (
          <TablePagination
            currentPage={page}
            totalPages={Math.ceil(sortedSlides.length / limit) || 1}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(lim) => {
              setLimit(lim);
              setPage(1);
            }}
            label="Danh sách slide"
            disabled={isLoading}
            className="mt-4"
          />
        )}
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody><p>Bạn có chắc muốn xoá slide <strong>{deleteTarget?.title}</strong>?</p></ModalBody>
          <ModalFooter>
            <AppButton variant="ghost" onClick={() => setDeleteTarget(null)}>Huỷ</AppButton>
            <AppButton color="danger" isLoading={deleteMutation.isPending} onClick={handleDelete}>Xoá</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
