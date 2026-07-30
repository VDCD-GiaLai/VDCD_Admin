import { useQuery } from "@tanstack/react-query";
import { clientFetch } from "@/lib/api-client";
import { usePermission } from "./usePermission";
import type { GlobalSearchResult } from "@/types/search";

interface SearchParams {
  q: string;
}

export function useGlobalSearch({ q }: SearchParams) {
  const canPrograms = usePermission("programs:read");
  const canSolutions = usePermission("solutions:read");
  const canProjects = usePermission("projects:read");
  const canArticles = usePermission("articles:read");
  const canJobs = usePermission("jobs:read");
  const canLeads = usePermission("leads:read");
  const canAdminUsers = usePermission("admin-users:read");

  const types = [
    canPrograms && "programs",
    canSolutions && "solutions",
    canProjects && "projects",
    canArticles && "articles",
    canJobs && "jobs",
    canLeads && "leads",
    canAdminUsers && "admin-users",
  ]
    .filter(Boolean)
    .join(",");

  return useQuery({
    queryKey: ["global-search", q, types],
    queryFn: async ({ signal }) => {
      if (!q.trim()) return {};
      
      return clientFetch<GlobalSearchResult>(
        `/api/search?q=${encodeURIComponent(q)}&types=${types}`,
        { signal }
      );
    },
    enabled: q.trim().length > 0 && types.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
}
