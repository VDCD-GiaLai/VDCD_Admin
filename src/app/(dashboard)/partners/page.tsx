"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppButton, Spinner, Badge } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import {
  usePartners,
  useDeletePartner,
  useTogglePartner,
  useReorderPartners,
  partnerKeys,
} from "@/features/partners/api";
import { useQueryClient } from "@tanstack/react-query";
import { usePermission } from "@/hooks/usePermission";
import type { Partner } from "@/types/partner";

// ─── Sortable row ────────────────────────────────────────────

function SortablePartnerRow({
  partner,
  onEdit,
  onDelete,
  onToggle,
  canDelete,
}: {
  partner: Partner;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
  canDelete: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: partner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-border bg-surface transition-colors hover:bg-surface-muted/50"
    >
      {/* Drag handle */}
      <td className="w-10 px-3 py-2.5">
        <button
          type="button"
          className="cursor-grab text-text-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
          </svg>
        </button>
      </td>

      {/* Logo */}
      <td className="w-16 px-3 py-2.5">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-border bg-primary/10 text-lg font-bold text-primary">
          {partner.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={partner.logo}
              alt={partner.name}
              className="h-full w-full object-contain"
            />
          ) : (
            partner.name.charAt(0).toUpperCase()
          )}
        </div>
      </td>

      {/* Name */}
      <td className="px-3 py-2.5 font-medium text-text">{partner.name}</td>

      {/* Website */}
      <td className="px-3 py-2.5 text-sm text-text-muted">
        {partner.websiteUrl ? (
          <a
            href={partner.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            {new URL(partner.websiteUrl).hostname}
          </a>
        ) : (
          "—"
        )}
      </td>

      {/* Status toggle */}
      <td className="px-3 py-2.5 text-center">
        <button
          type="button"
          onClick={() => onToggle(!partner.isActive)}
          className="inline-flex"
        >
          <Badge
            color={partner.isActive ? "success" : "secondary"}
            variant="soft"
          >
            {partner.isActive ? "Hiển thị" : "Ẩn"}
          </Badge>
        </button>
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
            aria-label="Sửa"
            onClick={onEdit}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
          {canDelete && (
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
              aria-label="Xoá"
              onClick={onDelete}
            >
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
 * Partners list page — UC-PTN-01.
 * Features: DnD reorder, toggle active, CRUD.
 */
export default function PartnersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: partners, isLoading } = usePartners();
  const deleteMutation = useDeletePartner();
  const toggleMutation = useTogglePartner();
  const reorderMutation = useReorderPartners();
  const canCreate = usePermission("partners:create");
  const canDelete = usePermission("partners:delete");
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [localOrder, setLocalOrder] = useState<Partner[] | null>(null);

  // Use local order if we're mid-reorder, otherwise use server data
  const sortedPartners = useMemo(
    () => localOrder ?? (partners ? [...partners].sort((a, b) => a.order - b.order) : []),
    [localOrder, partners],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const items = [...sortedPartners];
      const oldIdx = items.findIndex((p) => p.id === active.id);
      const newIdx = items.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(items, oldIdx, newIdx);

      // Optimistic local update
      setLocalOrder(reordered);

      // Send reorder to API
      const payload = reordered.map((p, i) => ({ id: p.id, order: i }));
      reorderMutation.mutate(payload, {
        onSuccess: () => {
          queryClient.setQueryData(partnerKeys.list(), reordered);
          setLocalOrder(null); // clear local override, refetch will update
          toast({ title: "Đã sắp xếp lại", color: "success" });
        },
        onError: (error) => {
          setLocalOrder(null);
          toast({ title: "Sắp xếp thất bại", description: error.message, color: "danger" });
        },
      });
    },
    [sortedPartners, reorderMutation, toast, queryClient],
  );

  const handleToggle = useCallback(
    (id: string, isActive: boolean) => {
      toggleMutation.mutate(
        { id, isActive },
        {
          onSuccess: () => {
            toast({
              title: isActive ? "Đã hiển thị" : "Đã ẩn",
              color: "success",
            });
          },
          onError: (error) => {
            toast({ title: "Thao tác thất bại", description: error.message, color: "danger" });
          },
        },
      );
    },
    [toggleMutation, toast],
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Đã xoá", description: `"${deleteTarget.name}" đã được xoá.`, color: "success" });
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast({ title: "Xoá thất bại", description: error.message, color: "danger" });
      },
    });
  }, [deleteTarget, deleteMutation, toast]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">Đối tác</h1>
            <p className="text-sm text-text-muted">
              Quản lý đối tác & logo. Kéo thả để sắp xếp thứ tự hiển thị.
            </p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/partners/new")}>
              + Thêm đối tác
            </AppButton>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedPartners.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50">
                    <th className="w-10 px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted" />
                    <th className="w-16 px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted">Logo</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted">Tên</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted">Website</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-text-muted">Trạng thái</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-text-muted">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPartners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-text-muted">
                        Chưa có đối tác nào
                      </td>
                    </tr>
                  ) : (
                    sortedPartners.map((partner) => (
                      <SortablePartnerRow
                        key={partner.id}
                        partner={partner}
                        onEdit={() => router.push(`/partners/${partner.id}`)}
                        onDelete={() => setDeleteTarget(partner)}
                        onToggle={(isActive) => handleToggle(partner.id, isActive)}
                        canDelete={canDelete}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>Bạn có chắc muốn xoá đối tác <strong>{deleteTarget?.name}</strong>?</p>
          </ModalBody>
          <ModalFooter>
            <AppButton variant="ghost" onClick={() => setDeleteTarget(null)}>Huỷ</AppButton>
            <AppButton color="danger" isLoading={deleteMutation.isPending} onClick={handleDelete}>Xoá</AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
