"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboardStats } from "../api";
import { useJobs } from "@/features/jobs/api";
import { DraftContentTable } from "./DraftContentTable";
import { AppButton, Badge } from "@/components/ui";

function UnreadLeadBadge() {
  const { data, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex h-[104px] animate-pulse items-center rounded-xl border border-border bg-surface p-5 shadow-[0px_2px_2px_rgba(0,0,0,0.05)]" />
    );
  }

  if (isError || !data) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 shadow-[0px_2px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
            <polyline points="15,9 18,9 18,11" />
            <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2v0" />
            <line x1="6" x2="7" y1="10" y2="10" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-text-muted">Leads chưa đọc</h3>
          <p className="text-2xl font-bold text-text">
            {data.unreadLeads}
            {data.unreadLeads > 0 && (
              <span className="ml-2 inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </p>
        </div>
      </div>
      <Link
        href="/leads"
        className="text-sm font-medium text-primary hover:underline"
      >
        Xem tất cả &rarr;
      </Link>
    </div>
  );
}

function UrgentJobsList() {
  const router = useRouter();
  // Fetch active jobs, expecting API to sort urgent first.
  const { data, isLoading, isError } = useJobs({ isActive: true, limit: 5 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-[0px_2px_2px_rgba(0,0,0,0.05)]">
        <div className="h-6 w-1/3 animate-pulse rounded bg-border" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-border" />
        ))}
      </div>
    );
  }

  if (isError || !data || data.items.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-[0px_2px_2px_rgba(0,0,0,0.05)]">
        <h3 className="mb-4 text-lg font-bold text-text">Tuyển dụng khẩn cấp</h3>
        <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
          Không có job nào cần tuyển gấp.
        </div>
      </div>
    );
  }

  // Filter urgent jobs just in case API doesn't only return urgent, but we want to show urgent jobs.
  const urgentJobs = data.items.filter((job) => job.isUrgent).slice(0, 5);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-[0px_2px_2px_rgba(0,0,0,0.05)]">
      <h3 className="mb-4 text-lg font-bold text-text">Tuyển dụng khẩn cấp</h3>
      {urgentJobs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
          Không có job nào cần tuyển gấp.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {urgentJobs.map((job) => (
            <div
              key={job.id}
              className="group flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => router.push(`/jobs/${job.id}`)}
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-text group-hover:text-primary transition-colors">
                  {job.title}
                </span>
                <span className="text-xs text-text-muted">{job.location ?? "Chưa xác định"}</span>
              </div>
              <Badge color="danger" variant="soft">Urgent</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickCreateActions() {
  const router = useRouter();

  const actions = [
    { label: "Tạo Program mới", path: "/programs/new", icon: "mdi:flag" },
    { label: "Tạo Solution mới", path: "/solutions/new", icon: "mdi:lightbulb" },
    { label: "Tạo Project mới", path: "/projects/new", icon: "mdi:briefcase" },
    { label: "Tạo Article mới", path: "/articles/new", icon: "mdi:text-box" },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-[0px_2px_2px_rgba(0,0,0,0.05)]">
      <h3 className="mb-4 text-lg font-bold text-text">Tạo nhanh</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
        {actions.map((action) => (
          <AppButton
            key={action.path}
            variant="outline"
            className="flex h-auto flex-col gap-2 py-4 text-center justify-center border-border hover:border-primary"
            onClick={() => router.push(action.path)}
          >
            <span className="text-sm font-medium">{action.label}</span>
          </AppButton>
        ))}
      </div>
    </div>
  );
}

export function EditorDashboard() {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UnreadLeadBadge />
          <div className="mt-6">
            <DraftContentTable />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <QuickCreateActions />
          <UrgentJobsList />
        </div>
      </div>
    </>
  );
}
