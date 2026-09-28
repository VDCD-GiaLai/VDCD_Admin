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
  usePrograms,
  useDeleteProgram,
  usePublishProgram,
  useReorderPrograms,
  programKeys,
  type ProgramFilters,
} from "@/features/programs/api";
import { useOperationFields } from "@/features/operation-fields/api";
import { usePermission } from "@/hooks/usePermission";
import { useQueryClient } from "@tanstack/react-query";
import type { Program } from "@/types/program";

// ─── Sortable Row ────────────────────────────────────────────

function SortableProgramRow({
  program,
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
  program: Program;
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
    id: program.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  const displayOrder = program.order ?? (page - 1) * limit + index + 1;

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
          {program.thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={program.thumbnail}
              alt={program.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted/40">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.22a.75.75 0 00-1.06 0l-1.91 1.91a.75.75 0 01-1.06 0l-3.38-3.38a.75.75 0 00-1.06 0L2.5 11.06zm10.25-4.81a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      </td>

      {/* Title & Short Description */}
      <td className="px-3 py-2.5">
        <div>
          <button
            type="button"
            className="text-left font-medium text-text hover:text-primary hover:underline transition-colors"
            onClick={() => router.push(`/programs/${program.id}`)}
          >
            {program.title}
          </button>
          {program.shortDescription && (
            <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
              {program.shortDescription}
            </p>
          )}
        </div>
      </td>

      {/* Field */}
      <td className="px-3 py-2.5">
        <span className="text-sm text-text-muted">
          {program.field?.name ?? "—"}
        </span>
      </td>

      {/* Publish status */}
      <td className="w-28 px-3 py-2.5 text-center">
        <PublishToggle
          isPublished={program.isPublished}
          onToggle={(val) => onPublish(program.id, val)}
          isLoading={isPublishing}
        />
      </td>

      {/* Actions */}
      <td className="w-24 px-3 py-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
            aria-label="Sửa"
            onClick={() => router.push(`/programs/${program.id}`)}
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

export default function ProgramsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canCreate = usePermission("programs:create");
  const canDelete = usePermission("programs:delete");
  const canUpdate = usePermission("programs:update");

  // ── Filters ──────────────────────────────────────────────────
  const [filters, setFilters] = useState<ProgramFilters>({
    page: 1,
    limit: 10,
    fieldId: "",
    isPublished: "",
  });

  const { data: programsData, isLoading } = usePrograms(filters);
  const { data: operationFields } = useOperationFields();
  const deleteMutation = useDeleteProgram();
  const publishMutation = usePublishProgram();
  const reorderMutation = useReorderPrograms();

  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [localOrder, setLocalOrder] = useState<Program[] | null>(null);

  // Check if filtering is active (reordering is only enabled when viewing unfiltered list)
  const isFiltered = Boolean(
    filters.fieldId ||
      (filters.isPublished !== "" && filters.isPublished !== undefined),
  );

  const displayedPrograms = useMemo(() => {
    return localOrder ?? (programsData?.items ?? []);
  }, [localOrder, programsData?.items]);

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

      const items = [...displayedPrograms];
      const oldIdx = items.findIndex((p) => p.id === active.id);
      const newIdx = items.findIndex((p) => p.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(items, oldIdx, newIdx);
      setLocalOrder(reordered);

      const baseOrder = ((filters.page || 1) - 1) * (filters.limit || 10);
      const payload = reordered.map((p, i) => ({
        id: p.id,
        order: baseOrder + i + 1,
      }));

      reorderMutation.mutate(payload, {
        onSuccess: () => {
          queryClient.setQueryData(
            programKeys.list(filters),
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
          toast({ title: "Đã cập nhật vị trí chương trình", color: "success" });
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
    [displayedPrograms, filters, reorderMutation, queryClient, toast],
  );

  // ── Handlers ─────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────

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
            <h1 className="text-xl font-bold text-text">Chương trình</h1>
            <p className="text-sm text-text-muted">
              Quản lý các chương trình và hoạt động tiêu biểu.
            </p>
          </div>
          {canCreate && (
            <AppButton onClick={() => router.push("/programs/new")}>
              + Thêm chương trình
            </AppButton>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <DropdownSelect
            value={filters.fieldId ?? ""}
            onChange={(val) =>
              setFilters((f) => ({
                ...f,
                fieldId: val || undefined,
                page: 1,
              }))
            }
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
            onChange={(val) =>
              setFilters((f) => ({
                ...f,
                isPublished:
                  val === ""
                    ? ""
                    : val === "true",
                page: 1,
              }))
            }
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "true", label: "Đã xuất bản" },
              { value: "false", label: "Bản nháp" },
            ]}
          />

          {isFiltered && (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  page: 1,
                  limit: filters.limit,
                  fieldId: "",
                  isPublished: "",
                })
              }
              className="text-xs text-primary hover:underline"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>

        {/* Notice when reordering is disabled due to active filters */}
        {isFiltered && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 shrink-0 text-amber-600"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Tính năng kéo thả sắp xếp tạm thời tắt khi đang lọc dữ liệu. Vui lòng xoá bộ lọc để sắp xếp vị trí hiển thị.
            </span>
          </div>
        )}

        {/* Sortable Table */}
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-left text-sm text-text">
              <thead className="border-b border-border bg-surface-muted/60 text-xs font-semibold text-text-muted uppercase">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <span className="sr-only">Kéo thả</span>
                  </th>
                  <th className="w-14 px-3 py-3 text-center">STT</th>
                  <th className="w-16 px-3 py-3">Ảnh</th>
                  <th className="px-3 py-3">Tiêu đề chương trình</th>
                  <th className="px-3 py-3">Lĩnh vực</th>
                  <th className="w-28 px-3 py-3 text-center">Trạng thái</th>
                  <th className="w-24 px-3 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedPrograms.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-text-muted"
                    >
                      Chưa có chương trình nào
                    </td>
                  </tr>
                ) : (
                  <SortableContext
                    items={displayedPrograms.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {displayedPrograms.map((program, index) => (
                      <SortableProgramRow
                        key={program.id}
                        program={program}
                        index={index}
                        page={filters.page || 1}
                        limit={filters.limit || 10}
                        isDragDisabled={
                          isFiltered || reorderMutation.isPending || !canUpdate
                        }
                        onPublish={handlePublish}
                        isPublishing={publishMutation.isPending}
                        onDelete={() => setDeleteTarget(program)}
                        canDelete={canDelete}
                        router={router}
                      />
                    ))}
                  </SortableContext>
                )}
              </tbody>
            </table>
          </DndContext>
        </div>

        <TablePagination
          currentPage={filters.page || 1}
          totalPages={programsData?.totalPages || 1}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          limit={filters.limit || 10}
          onLimitChange={(limit) =>
            setFilters((f) => ({ ...f, limit, page: 1 }))
          }
          label="Danh sách chương trình"
          disabled={isLoading}
          className="mt-4"
        />
      </div>

      {/* Delete modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>Xác nhận xoá</ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc muốn xoá chương trình{" "}
              <strong>{deleteTarget?.title}</strong>?
            </p>
          </ModalBody>
          <ModalFooter>
            <AppButton
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
            >
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
