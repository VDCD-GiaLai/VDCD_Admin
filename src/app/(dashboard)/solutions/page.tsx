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
import { AppButton, Spinner, DropdownSelect } from "@/components/ui";
import { useToast } from "@/components/ui";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui";
import { PublishToggle, TablePagination } from "@/components/shared";
import {
  useSolutions,
  useDeleteSolution,
  usePublishSolution,
  useReorderSolutions,
  solutionKeys,
  type SolutionFilters,
} from "@/features/solutions/api";
import { useOperationFields } from "@/features/operation-fields/api";
import { usePermission } from "@/hooks/usePermission";
import { useQueryClient } from "@tanstack/react-query";
import type { Solution } from "@/types/solution";

// ─── Sortable Row ────────────────────────────────────────────

function SortableSolutionRow({
  solution,
  index,
  page,
  limit,
  isDragDisabled,
  onPublish,
  isPublishing,
  onDelete,
  canDelete,
  router,
}: {
  solution: Solution;
  index: number;
  page: number;
  limit: number;
  isDragDisabled: boolean;
  onPublish: (id: string, isPublished: boolean) => void;
  isPublishing: boolean;
  onDelete: () => void;
  canDelete: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: solution.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  const displayOrder = solution.order ?? (page - 1) * limit + index + 1;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-border bg-surface transition-colors hover:bg-surface-muted/50 ${
        isDragging ? "bg-surface-muted shadow-md" : ""
      }`}
    >
      {/* Drag handle */}
      <td className="w-10 px-3 py-2.5 text-center">
        {isDragDisabled ? (
          <span
            className="inline-block cursor-not-allowed text-text-muted/30"
            title="Không thể sắp xếp khi đang lọc dữ liệu hoặc đang lưu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        ) : (
          <button
            type="button"
            className="inline-flex cursor-grab items-center justify-center rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text active:cursor-grabbing"
            title="Kéo thả để sắp xếp vị trí hiển thị"
            aria-label="Kéo thả sắp xếp"
            {...attributes}
            {...listeners}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </td>

      {/* STT / Order Badge */}
      <td className="w-14 px-3 py-2.5 text-center">
        <span className="inline-flex items-center justify-center rounded bg-surface-muted px-2 py-0.5 font-mono text-xs font-semibold text-text-muted">
          #{displayOrder}
        </span>
      </td>

      {/* Thumbnail */}
      <td className="w-16 px-3 py-2.5">
        <div className="h-10 w-14 overflow-hidden rounded-md border border-border bg-surface-muted">
          {solution.thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={solution.thumbnail}
              alt={solution.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
              —
            </div>
          )}
        </div>
      </td>

      {/* Tiêu đề & mô tả */}
      <td className="px-3 py-2.5">
        <div>
          <p className="font-medium text-text">{solution.title}</p>
          {solution.shortDescription && (
            <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
              {solution.shortDescription}
            </p>
          )}
        </div>
      </td>

      {/* Lĩnh vực */}
      <td className="px-3 py-2.5 text-sm text-text-muted">
        {solution.field?.name ?? "—"}
      </td>

      {/* Trạng thái */}
      <td className="px-3 py-2.5 text-center">
        <PublishToggle
          isPublished={solution.isPublished}
          onToggle={(val) => onPublish(solution.id, val)}
          isLoading={isPublishing}
        />
      </td>

      {/* Thao tác */}
      <td className="w-24 px-3 py-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
            aria-label="Sửa"
            onClick={() => router.push(`/solutions/${solution.id}`)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function SolutionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canCreate = usePermission("solutions:create");
  const canDelete = usePermission("solutions:delete");
  const canUpdate = usePermission("solutions:update");

  const [filters, setFilters] = useState<SolutionFilters>({
    page: 1,
    limit: 10,
    fieldId: "",
    isPublished: "",
  });

  const { data: solutionsData, isLoading } = useSolutions(filters);
  const { data: operationFields } = useOperationFields();
  const deleteMutation = useDeleteSolution();
  const publishMutation = usePublishSolution();
  const reorderMutation = useReorderSolutions();

  const [deleteTarget, setDeleteTarget] = useState<Solution | null>(null);
  const [localOrder, setLocalOrder] = useState<Solution[] | null>(null);

  // Check if filtering is active (reordering is only enabled when viewing unfiltered list)
  const isFiltered = Boolean(
    filters.fieldId ||
      (filters.isPublished !== "" && filters.isPublished !== undefined),
  );

  const displayedSolutions = useMemo(() => {
    return localOrder ?? (solutionsData?.items ?? []);
  }, [localOrder, solutionsData?.items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const items = [...displayedSolutions];
      const oldIdx = items.findIndex((s) => s.id === active.id);
      const newIdx = items.findIndex((s) => s.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(items, oldIdx, newIdx);
      setLocalOrder(reordered);

      const baseOrder = ((filters.page || 1) - 1) * (filters.limit || 10);
      const payload = reordered.map((s, i) => ({
        id: s.id,
        order: baseOrder + i + 1,
      }));

      reorderMutation.mutate(payload, {
        onSuccess: () => {
          queryClient.setQueryData(
            solutionKeys.list(filters),
            (old: unknown) => {
              if (!old || typeof old !== "object") return old;
              return {
                ...old,
                items: reordered.map((item, idx) => ({
                  ...item,
                  order: baseOrder + idx + 1,
                })),
              };
            },
          );
          setLocalOrder(null);
          toast({ title: "Đã cập nhật vị trí giải pháp", color: "success" });
        },
        onError: (error) => {
          setLocalOrder(null);
          toast({
            title: "Sắp xếp thất bại",
            description: error.message,
            color: "danger",
          });
        },
      });
    },
    [displayedSolutions, filters, reorderMutation, queryClient, toast],
  );

  const handlePublish = useCallback(
    (id: string, isPublished: boolean) => {
      publishMutation.mutate(
        { id, isPublished },
        {
          onSuccess: () => {
            toast({
              title: isPublished ? "Đã xuất bản" : "Đã chuyển về bản nháp",
              color: "success",
            });
          },
          onError: (error) => {
            toast({
              title: "Thao tác thất bại",
              description: error.message,
              color: "danger",
            });
          },
        },
      );
    },
    [publishMutation, toast],
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Đã xoá",
          description: `"${deleteTarget.title}" đã được xoá.`,
          color: "success",
        });
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast({
          title: "Xoá thất bại",
          description: error.message,
          color: "danger",
        });
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
            <h1 className="text-xl font-bold text-text">Giải pháp</h1>
            <p className="text-sm text-text-muted">
              Quản lý các giải pháp chuyên môn. Kéo thả để sắp xếp thứ tự hiển thị.
            </p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/solutions/new")}>
              + Thêm giải pháp
            </AppButton>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <DropdownSelect
            value={filters.fieldId ?? ""}
            onChange={(val) => {
              setLocalOrder(null);
              setFilters((f) => ({
                ...f,
                fieldId: val || undefined,
                page: 1,
              }));
            }}
            options={[
              { value: "", label: "Tất cả lĩnh vực" },
              ...(operationFields?.map((field) => ({
                value: field.id,
                label: field.name,
              })) ?? []),
            ]}
          />

          <DropdownSelect
            value={
              filters.isPublished === ""
                ? ""
                : filters.isPublished
                  ? "true"
                  : "false"
            }
            onChange={(val) => {
              setLocalOrder(null);
              setFilters((f) => ({
                ...f,
                isPublished: val === "" ? "" : val === "true",
                page: 1,
              }));
            }}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "true", label: "Đã xuất bản" },
              { value: "false", label: "Bản nháp" },
            ]}
          />
        </div>

        {/* Informational notice when filter is active */}
        {isFiltered && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3.5 py-2.5 text-xs text-text-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 shrink-0 text-warning"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Đang áp dụng bộ lọc dữ liệu. Vui lòng chuyển về &ldquo;Tất cả&rdquo; để kích hoạt tính năng kéo thả sắp xếp vị trí hiển thị.
            </span>
            <button
              type="button"
              onClick={() => {
                setLocalOrder(null);
                setFilters((f) => ({
                  ...f,
                  fieldId: "",
                  isPublished: "",
                  page: 1,
                }));
              }}
              className="ml-auto font-medium text-primary hover:underline"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}

        {/* Drag and drop Sortable Table */}
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayedSolutions.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50">
                    <th className="w-10 px-3 py-2.5 text-center text-xs font-semibold uppercase text-text-muted" />
                    <th className="w-14 px-3 py-2.5 text-center text-xs font-semibold uppercase text-text-muted">
                      STT
                    </th>
                    <th className="w-16 px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted">
                      Ảnh
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted">
                      Tiêu đề
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-text-muted">
                      Lĩnh vực
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-text-muted">
                      Trạng thái
                    </th>
                    <th className="w-24 px-3 py-2.5 text-center text-xs font-semibold uppercase text-text-muted">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSolutions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-sm text-text-muted"
                      >
                        Chưa có giải pháp nào
                      </td>
                    </tr>
                  ) : (
                    displayedSolutions.map((solution, idx) => (
                      <SortableSolutionRow
                        key={solution.id}
                        solution={solution}
                        index={idx}
                        page={filters.page || 1}
                        limit={filters.limit || 10}
                        isDragDisabled={
                          isFiltered || !canUpdate || reorderMutation.isPending
                        }
                        onPublish={handlePublish}
                        isPublishing={publishMutation.isPending}
                        onDelete={() => setDeleteTarget(solution)}
                        canDelete={canDelete}
                        router={router}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>

        <TablePagination
          currentPage={filters.page || 1}
          totalPages={solutionsData?.totalPages || 1}
          onPageChange={(page) => {
            setLocalOrder(null);
            setFilters((f) => ({ ...f, page }));
          }}
          limit={filters.limit || 10}
          onLimitChange={(limit) => {
            setLocalOrder(null);
            setFilters((f) => ({ ...f, limit, page: 1 }));
          }}
          label="Danh sách giải pháp"
          disabled={isLoading || reorderMutation.isPending}
          className="mt-4"
        />
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá giải pháp{" "}
              <strong>{deleteTarget?.title}</strong>?
            </p>
          </ModalBody>
          <ModalFooter>
            <AppButton variant="ghost" onClick={() => setDeleteTarget(null)}>
              Huỷ
            </AppButton>
            <AppButton
              color="danger"
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Xoá
            </AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
