"use client";

import { useDashboardStats } from "../api";

function MetricCard({
  title,
  value,
  accentColor,
  icon,
}: {
  title: string;
  value: string | number;
  accentColor: "primary" | "success" | "warning" | "danger" | "info";
  icon: React.ReactNode;
}) {
  const accentClasses = {
    primary: "border-l-primary text-primary",
    success: "border-l-success text-success",
    warning: "border-l-warning text-warning",
    danger: "border-l-danger text-danger",
    info: "border-l-info text-info",
  };

  const softBgClasses = {
    primary: "bg-primary/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
    danger: "bg-danger/10",
    info: "bg-info/10",
  };

  return (
    <div
      className={`relative flex items-center justify-between overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-[0px_2px_2px_rgba(0,0,0,0.05)] ${accentClasses[accentColor]} border-l-[3px]`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-muted">{title}</span>
        <span className="text-2xl font-bold text-text">{value}</span>
      </div>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg ${softBgClasses[accentColor]}`}
      >
        {icon}
      </div>
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-xl border border-border bg-surface shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
        Không thể tải dữ liệu thống kê.
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Leads chưa đọc"
        value={data.unreadLeads}
        accentColor="primary"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"/>
            <polyline points="15,9 18,9 18,11"/>
            <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2v0"/>
            <line x1="6" x2="7" y1="10" y2="10"/>
          </svg>
        }
      />
      <MetricCard
        title="Dự án đang xuất bản"
        value={data.publishedProjects}
        accentColor="success"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M12 22v-7l-2-2a4 4 0 1 1 4 0l-2 2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        }
      />
      <MetricCard
        title="Jobs đang tuyển"
        value={data.activeJobs}
        accentColor="info"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        }
      />
      <MetricCard
        title="Jobs Urgent"
        value={data.urgentJobs}
        accentColor="danger"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M12 2v20"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        }
      />
    </div>
  );
}
