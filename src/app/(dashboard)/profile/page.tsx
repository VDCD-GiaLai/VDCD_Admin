"use client";

import { ProfileView } from "@/features/profile/components/ProfileView";
import { ProfileEditForm } from "@/features/profile/components/ProfileEditForm";
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-text-muted">
          Quản lý thông tin và bảo mật tài khoản của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ProfileView />
          <ProfileEditForm />
        </div>
        
        <div>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
