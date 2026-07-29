"use client";

import { useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, AppButton } from "@/components/ui";
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
    handleSubmit,
    reset,
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
      stats: { provinces: 0, centers: 0, projects: 0, staff: 0 },
      socialLinks: { facebook: "", zalo: "", youtube: "" },
    },
  });

  useEffect(() => {
    if (org) {
      reset({
        name: org.name,
        tagline: org.tagline ?? "",
        description: org.description ?? "",
        mission: org.mission ?? "",
        vision: org.vision ?? "",
        coreValues: org.coreValues ?? "",
        foundedYear: org.foundedYear ?? null,
        stats: {
          provinces: org.stats?.provinces ?? 0,
          centers: org.stats?.centers ?? 0,
          projects: org.stats?.projects ?? 0,
          staff: org.stats?.staff ?? 0,
        },
        socialLinks: {
          facebook: org.socialLinks?.facebook ?? "",
          zalo: org.socialLinks?.zalo ?? "",
          youtube: org.socialLinks?.youtube ?? "",
        },
      });
    }
  }, [org, reset]);

  const onSubmit = (data: OrganizationFormData) => {
    updateMutation.mutate(data, {
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
            <FormInput
              label="Năm thành lập"
              type="number"
              errorMessage={errors.foundedYear?.message}
              {...register("foundedYear", { valueAsNumber: true })}
            />
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

        {/* ── Social Links ── */}
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Mạng xã hội
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormInput
                label="Facebook"
                type="url"
                placeholder="https://facebook.com/..."
                errorMessage={errors.socialLinks?.facebook?.message}
                {...register("socialLinks.facebook")}
              />
              <FormInput
                label="Zalo"
                type="url"
                placeholder="https://zalo.me/..."
                errorMessage={errors.socialLinks?.zalo?.message}
                {...register("socialLinks.zalo")}
              />
              <FormInput
                label="YouTube"
                type="url"
                placeholder="https://youtube.com/..."
                errorMessage={errors.socialLinks?.youtube?.message}
                {...register("socialLinks.youtube")}
              />
            </div>
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
