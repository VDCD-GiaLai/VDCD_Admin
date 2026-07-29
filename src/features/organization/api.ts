import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientFetch, ApiError } from "@/lib/api-client";
import type { Organization } from "@/types/organization";
import type { OrganizationFormData } from "./schema";

// ─── Query keys ──────────────────────────────────────────────

export const organizationKeys = {
  all: ["organization"] as const,
  detail: () => [...organizationKeys.all, "detail"] as const,
};

// ─── Queries ─────────────────────────────────────────────────

/**
 * GET /organization — fetch the single organization record.
 */
export function useOrganization() {
  return useQuery<Organization>({
    queryKey: organizationKeys.detail(),
    queryFn: () => clientFetch<Organization>("/api/organization"),
  });
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * PUT /organization — update the organization record.
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation<Organization, ApiError, OrganizationFormData>({
    mutationFn: (data) =>
      clientFetch<Organization>("/api/organization", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
