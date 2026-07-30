"use client";

import { useCurrentUser } from "@/features/auth/api";
import { Badge } from "@/components/ui";
import { format } from "date-fns";

export function ProfileView() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex animate-pulse items-center gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="h-16 w-16 rounded-full bg-border" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-32 rounded bg-border" />
          <div className="h-4 w-48 rounded bg-border" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : "AD";

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
        {initials}
      </div>
      
      <div className="flex flex-1 flex-col items-center sm:items-start gap-1">
        <h2 className="text-xl font-bold text-text">{user.username}</h2>
        <p className="text-sm text-text-muted">{user.email}</p>
        
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge color="primary" variant="soft">
            {user.role}
          </Badge>
          <span className="text-xs text-text-muted flex items-center">
            Tham gia: {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
