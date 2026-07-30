"use client";

import { usePermission } from "@/hooks/usePermission";
import { SuperadminDashboard } from "@/features/dashboard/components/SuperadminDashboard";
import { EditorDashboard } from "@/features/dashboard/components/EditorDashboard";

export default function DashboardPage() {
  const isSuperadmin = usePermission("*");
  const isEditor = usePermission("programs:create"); // Editor has programs:create

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Tổng quan VDCD</h1>
        <p className="mt-1 text-sm text-text-muted">
          Xin chào, dưới đây là tình hình hoạt động của website.
        </p>
      </div>

      {isSuperadmin ? (
        <SuperadminDashboard />
      ) : isEditor ? (
        <EditorDashboard />
      ) : (
        <div className="rounded-md border border-border bg-surface p-8 text-center shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-text">Tính năng đang được phát triển</h2>
          <p className="text-sm text-text-muted">
            Dashboard dành cho vai trò của bạn sẽ sớm được cập nhật. Bạn có thể truy cập các tính năng từ menu bên trái.
          </p>
        </div>
      )}
    </div>
  );
}
