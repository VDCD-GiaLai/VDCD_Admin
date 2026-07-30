import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch } from "@/lib/api-client";
import { AdminUser } from "@/types/auth";
import type { PaginatedData, ApiErrorResponse } from "@/types/api";

// ─── TYPES ──────────────────────────────────────────────────────────────

export interface FilterAdminUserDto {
  page?: number;
  limit?: number;
  role?: string;
}

export interface CreateAdminUserDto {
  username: string;
  email: string;
  password?: string;
  role: string;
  isActive?: boolean;
}

export type UpdateAdminUserDto = Partial<CreateAdminUserDto>;

// ─── HOOKS ──────────────────────────────────────────────────────────────

export const adminUserKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (filters: FilterAdminUserDto) => [...adminUserKeys.lists(), filters] as const,
  details: () => [...adminUserKeys.all, "detail"] as const,
  detail: (id: string) => [...adminUserKeys.details(), id] as const,
};

export function useAdminUsers(filters: FilterAdminUserDto) {
  return useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters.page) searchParams.set("page", filters.page.toString());
      if (filters.limit) searchParams.set("limit", filters.limit.toString());
      if (filters.role) searchParams.set("role", filters.role);

      const qs = searchParams.toString();
      return clientFetch<PaginatedData<AdminUser>>(
        `/api/admin/users${qs ? `?${qs}` : ""}`
      );
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: async () => {
      // NOTE: There is no GET /admin/users/:id endpoint in API_DESCRIPTION.
      // But we can fetch the list and find the user.
      const res = await clientFetch<PaginatedData<AdminUser>>(`/api/admin/users?limit=100`);
      const user = res.items.find((u: AdminUser) => u.id === id);
      if (!user) {
        throw new Error("Không tìm thấy người dùng");
      }
      return user;
    },
    enabled: !!id,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiErrorResponse, CreateAdminUserDto>({
    mutationFn: (data) =>
      clientFetch<AdminUser>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminUser,
    ApiErrorResponse,
    { id: string; data: UpdateAdminUserDto }
  >({
    mutationFn: ({ id, data }) =>
      clientFetch<AdminUser>(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiErrorResponse, string>({
    mutationFn: (id) =>
      clientFetch<{ message: string }>(`/api/admin/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}
