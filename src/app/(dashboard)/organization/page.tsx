"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, AppButton, FormSelect } from "@/components/ui";

function FacebookIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
}
function YoutubeIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>;
}
function MessageCircleIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>;
}
function PhoneIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function MailIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}
function LinkedinIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>;
}
function InstagramIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
}
function DefaultLinkIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
}

const PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'hotline', label: 'Hotline / SĐT' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Khác (Nhập tùy chỉnh)' }
];

const getPlatformIcon = (platform: string) => {
  switch (platform?.toLowerCase()) {
    case 'facebook': return <FacebookIcon className="w-4 h-4 text-blue-600" />;
    case 'zalo':
    case 'messenger': return <MessageCircleIcon className="w-4 h-4 text-blue-500" />;
    case 'youtube': return <YoutubeIcon className="w-4 h-4 text-red-600" />;
    case 'hotline': return <PhoneIcon className="w-4 h-4 text-green-600" />;
    case 'email': return <MailIcon className="w-4 h-4 text-gray-500" />;
    case 'linkedin': return <LinkedinIcon className="w-4 h-4 text-blue-700" />;
    case 'instagram': return <InstagramIcon className="w-4 h-4 text-pink-600" />;
    default: return <DefaultLinkIcon className="w-4 h-4 text-gray-400" />;
  }
};

const getPlatformPlaceholder = (platform: string) => {
  switch (platform?.toLowerCase()) {
    case 'facebook': return 'https://facebook.com/...';
    case 'zalo': return 'https://zalo.me/...';
    case 'tiktok': return 'https://tiktok.com/@...';
    case 'youtube': return 'https://youtube.com/@...';
    case 'linkedin': return 'https://linkedin.com/company/...';
    case 'hotline': return '09... hoặc 0269...';
    case 'email': return 'contact@vdcd.vn';
    case 'messenger': return 'https://m.me/...';
    default: return 'https://...';
  }
};
import { useToast } from "@/components/ui";
import { Spinner } from "@/components/ui";
import { useOrganization, useUpdateOrganization } from "@/features/organization/api";
import {
  organizationSchema,
  type OrganizationFormData,
} from "@/features/organization/schema";

/**
 * Organization page — UC-ORG-01, UC-ORG-02.
 * Single-record form: GET organization, edit, PUT to save.
 */
export default function OrganizationPage() {
  const { toast } = useToast();
  const { data: org, isLoading } = useOrganization();
  const updateMutation = useUpdateOrganization();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      tagline: "",
      description: "",
      mission: "",
      vision: "",
      coreValues: "",
      foundedYear: null,
      address: "",
      stats: { provinces: 0, centers: 0, projects: 0, staff: 0 },
      socialLinksArray: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinksArray",
  });

  const socialLinksWatch = watch("socialLinksArray");

  useEffect(() => {
    if (org) {
      // Convert Record<string, string> to Array<{platform, url}>
      const socialLinksArray = Object.entries(org.socialLinks || {}).map(([key, value]) => ({
        platform: key,
        url: value as string,
      }));

      reset({
        name: org.name,
        tagline: org.tagline ?? "",
        description: org.description ?? "",
        mission: org.mission ?? "",
        vision: org.vision ?? "",
        coreValues: org.coreValues ?? "",
        foundedYear: org.foundedYear ?? null,
        address: org.address ?? "",
        stats: {
          provinces: org.stats?.provinces ?? 0,
          centers: org.stats?.centers ?? 0,
          projects: org.stats?.projects ?? 0,
          staff: org.stats?.staff ?? 0,
        },
        socialLinksArray,
      });
    }
  }, [org, reset]);

  const onSubmit = (data: OrganizationFormData) => {
    // Transform socialLinksArray back to Record<string, string>
    const socialLinks = data.socialLinksArray?.reduce((acc, curr) => {
      if (curr.platform && curr.url) {
        // format platform name to be camelCase or lowercase without spaces if needed, but keeping as typed is fine.
        acc[curr.platform] = curr.url;
      }
      return acc;
    }, {} as Record<string, string>) ?? {};

    // Create payload
    const payload = {
      ...data,
      socialLinks,
    };
    
    // Remove the array from payload to match DTO if needed (though API might just ignore it)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { socialLinksArray, ...apiPayload } = payload;

    updateMutation.mutate(apiPayload, {
      onSuccess: () => {
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin tổ chức đã được lưu.",
          color: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Cập nhật thất bại",
          description: error.message,
          color: "danger",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text">Thông tin tổ chức</h1>
        <p className="text-sm text-text-muted">
          Cập nhật thông tin chung của VDCD.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Basic Info ── */}
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Thông tin cơ bản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Tên tổ chức"
                isRequired
                errorMessage={errors.name?.message}
                {...register("name")}
              />
              <FormInput
                label="Khẩu hiệu"
                placeholder="Slogan..."
                errorMessage={errors.tagline?.message}
                {...register("tagline")}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Năm thành lập"
                type="number"
                errorMessage={errors.foundedYear?.message}
                {...register("foundedYear", { valueAsNumber: true })}
              />
              <FormInput
                label="Địa chỉ"
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                errorMessage={errors.address?.message}
                {...register("address")}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Mission, Vision, Core Values ── */}
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Sứ mệnh & Tầm nhìn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <FormTextarea
              label="Mô tả"
              rows={4}
              errorMessage={errors.description?.message}
              {...register("description")}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormTextarea
                label="Sứ mệnh"
                rows={4}
                errorMessage={errors.mission?.message}
                {...register("mission")}
              />
              <FormTextarea
                label="Tầm nhìn"
                rows={4}
                errorMessage={errors.vision?.message}
                {...register("vision")}
              />
            </div>
            <FormTextarea
              label="Giá trị cốt lõi"
              rows={4}
              errorMessage={errors.coreValues?.message}
              {...register("coreValues")}
            />
          </CardContent>
        </Card>

        {/* ── Statistics ── */}
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Thống kê
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <FormInput
                label="Tỉnh thành"
                type="number"
                {...register("stats.provinces", { valueAsNumber: true })}
              />
              <FormInput
                label="Trung tâm"
                type="number"
                {...register("stats.centers", { valueAsNumber: true })}
              />
              <FormInput
                label="Dự án"
                type="number"
                {...register("stats.projects", { valueAsNumber: true })}
              />
              <FormInput
                label="Nhân sự"
                type="number"
                {...register("stats.staff", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Social / Contact Links ── */}
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <div className="flex w-full flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-text">
                Liên hệ / Mạng xã hội
              </CardTitle>
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ platform: "", url: "" })}
              >
                + Thêm phương thức
              </AppButton>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {fields.length === 0 ? (
              <p className="text-sm text-text-muted">Chưa có phương thức liên hệ nào.</p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const currentPlatform = socialLinksWatch?.[index]?.platform || "other";
                  
                  return (
                    <div key={field.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface-alt/30 p-4 transition-all focus-within:border-primary/50 focus-within:shadow-sm hover:border-border-strong">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4">
                          <FormSelect
                            label="Nền tảng"
                            options={PLATFORM_OPTIONS}
                            errorMessage={errors.socialLinksArray?.[index]?.platform?.message}
                            {...register(`socialLinksArray.${index}.platform`)}
                          />
                        </div>
                        <div className="md:col-span-8">
                          <div className="relative">
                            <FormInput
                              label="Đường dẫn / SĐT / Email"
                              placeholder={getPlatformPlaceholder(currentPlatform)}
                              errorMessage={errors.socialLinksArray?.[index]?.url?.message}
                              {...register(`socialLinksArray.${index}.url`)}
                              className="pl-9"
                            />
                            <div className="absolute left-3 top-[34px] flex items-center justify-center pointer-events-none">
                              {getPlatformIcon(currentPlatform)}
                            </div>
                          </div>
                        </div>
                      </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-7 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
                      title="Xoá"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Submit ── */}
        <div className="flex items-center justify-end gap-3">
          {isDirty && (
            <p className="text-xs text-warning">Có thay đổi chưa lưu</p>
          )}
          <AppButton
            type="submit"
            isLoading={updateMutation.isPending}
            disabled={!isDirty}
          >
            Lưu thay đổi
          </AppButton>
        </div>
      </form>
    </div>
  );
}
