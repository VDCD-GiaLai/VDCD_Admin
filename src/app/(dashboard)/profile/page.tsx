"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { useCurrentUser } from "@/features/auth/api";

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Quản trị viên",
  editor: "Biên tập viên",
};

/**
 * Profile page — UC-AUTH-04
 * Displays current user information (read-only).
 */
export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text">Hồ sơ cá nhân</h1>

      <Card className="max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text">
            Thông tin tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-4">
            <InfoRow label="Tên đăng nhập" value={user.username} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow
              label="Vai trò"
              value={ROLE_LABELS[user.role] ?? user.role}
            />
            <InfoRow
              label="Trạng thái"
              value={user.isActive ? "Đang hoạt động" : "Đã khoá"}
            />
            <InfoRow
              label="Ngày tạo"
              value={new Date(user.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-sm font-medium text-text">{value}</dd>
    </div>
  );
}
