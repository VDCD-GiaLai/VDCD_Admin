"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";

/**
 * Dashboard overview — placeholder page.
 * Will be replaced with real stats in Phase 5.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text">
        Chào mừng đến VDCD Admin
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Dự án" value="—" description="Tổng số dự án" />
        <StatCard title="Bài viết" value="—" description="Bài viết đã xuất bản" />
        <StatCard title="Leads" value="—" description="Leads chưa đọc" />
        <StatCard title="Tuyển dụng" value="—" description="Vị trí đang mở" />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-text-muted">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-text">{value}</p>
        <p className="mt-1 text-xs text-text-muted">{description}</p>
      </CardContent>
    </Card>
  );
}
