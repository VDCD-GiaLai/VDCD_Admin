import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { OperationField } from "@/types/operation-field";
import type { OperationFieldFormData } from "./schema";

// ─── Query keys ──────────────────────────────────────────────

export const operationFieldKeys = {
  all: ["operation-fields"] as const,
  list: () => [...operationFieldKeys.all, "list"] as const,
  detail: (id: string) => [...operationFieldKeys.all, "detail", id] as const,
};

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /operation-fields — all fields sorted by order.
 */
export function useOperationFields() {
  return useQuery<OperationField[]>({
    queryKey: operationFieldKeys.list(),
    queryFn: () => clientFetch<OperationField[]>("/api/operation-fields"),
  });
}

/**
 * Single field by ID — from the full list.
 */
export function useOperationField(id: string) {
  const { data: fields, ...rest } = useOperationFields();
  const field = fields?.find((f) => f.id === id);
  return { data: field, ...rest };
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * POST /operation-fields — create a new field.
 */
export function useCreateOperationField() {
  const queryClient = useQueryClient();

  return useMutation<OperationField, ApiError, OperationFieldFormData>({
    mutationFn: (data) =>
      clientFetch<OperationField>("/api/operation-fields", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationFieldKeys.all });
    },
  });
}

/**
 * PATCH /operation-fields/:id — update a field.
 */
export function useUpdateOperationField(id: string) {
  const queryClient = useQueryClient();

  return useMutation<OperationField, ApiError, OperationFieldFormData>({
    mutationFn: (data) =>
      clientFetch<OperationField>(`/api/operation-fields/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationFieldKeys.all });
    },
  });
}

/**
 * DELETE /operation-fields/:id — delete a field (superadmin only).
 */
export function useDeleteOperationField() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) =>
      clientFetch<void>(`/api/operation-fields/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationFieldKeys.all });
    },
  });
}
