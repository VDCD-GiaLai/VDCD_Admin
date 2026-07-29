import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { AdminUser } from "@/types/auth";
import type { LoginFormData } from "./schema";

// ─── Query key factory ──────────────────────────────────────

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

// ─── Queries ────────────────────────────────────────────────

/**
 * Fetch the current logged-in user via GET /api/auth/me.
 * Used by dashboard layout to check auth status and get role.
 */
export function useCurrentUser() {
  return useQuery<AdminUser>({
    queryKey: authKeys.me(),
    queryFn: () => clientFetch<AdminUser>("/api/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes — user info doesn't change often
  });
}

// ─── Mutations ──────────────────────────────────────────────

interface LoginResult {
  user: Pick<AdminUser, "id" | "username" | "email" | "role">;
}

/**
 * Login mutation: POST /api/auth/login
 * On success, invalidates the "me" query to force refetch.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<LoginResult, ApiError, LoginFormData>({
    mutationFn: (data) =>
      clientFetch<LoginResult>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      router.push("/");
    },
  });
}

/**
 * Logout mutation: POST /api/auth/logout
 * On success, clears all queries and redirects to login.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<unknown, ApiError, void>({
    mutationFn: () =>
      clientFetch("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
    onError: () => {
      // Even if logout API fails, redirect to login
      queryClient.clear();
      router.push("/login");
    },
  });
}
