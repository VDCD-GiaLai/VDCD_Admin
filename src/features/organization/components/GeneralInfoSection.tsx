"use client";

import React from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea } from "@/components/ui";
import type { OrganizationFormData } from "../schema";

interface GeneralInfoSectionProps {
  register: UseFormRegister<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
}

export function GeneralInfoSection({ register, errors }: GeneralInfoSectionProps) {
  return (
    <Card className="border border-border bg-surface shadow-sm">
      <CardHeader className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            1
          </span>
          <div>
            <CardTitle className="text-base font-semibold text-text">
              Giới thiệu chung về tổ chức
            </CardTitle>
            <p className="text-xs text-text-muted">
              Thông tin pháp nhân, tên gọi, tên viết tắt và mô tả khái quát hiển thị trên trang Về chúng tôi.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-8">
            <FormInput
              label="Tên tổ chức / doanh nghiệp"
              isRequired
              placeholder="VD: TRUNG TÂM ĐỔI MỚI SÁNG TẠO GIA LAI"
              errorMessage={errors.name?.message}
              {...register("name")}
            />
          </div>
          <div className="md:col-span-4">
            <FormInput
              label="Tên viết tắt"
              placeholder="VD: VDCD Gia Lai"
              errorMessage={errors.shortName?.message}
              {...register("shortName")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <FormInput
              label="Khẩu hiệu (Slogan)"
              placeholder="VD: Kết nối - Sáng tạo - Phát triển"
              errorMessage={errors.tagline?.message}
              {...register("tagline")}
            />
          </div>
          <div className="md:col-span-3">
            <FormInput
              label="Mã số doanh nghiệp (ĐKKD)"
              placeholder="VD: 4101443823"
              errorMessage={errors.businessLicenseNo?.message}
              {...register("businessLicenseNo")}
            />
          </div>
          <div className="md:col-span-3">
            <FormInput
              label="Năm thành lập"
              type="number"
              placeholder="VD: 2020"
              errorMessage={errors.foundedYear?.message}
              {...register("foundedYear", {
                setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : Number(v)),
              })}
            />
          </div>
        </div>

        <div>
          <FormInput
            label="Địa chỉ trụ sở chính"
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
            errorMessage={errors.address?.message}
            {...register("address")}
          />
        </div>

        <div>
          <FormTextarea
            label="Mô tả giới thiệu tổ chức"
            rows={6}
            placeholder="Giới thiệu khái quát về mô hình xã hội hóa, sứ mệnh kết nối nguồn lực công nghệ, chuyên gia, dữ liệu và đồng hành phát triển địa phương..."
            errorMessage={errors.description?.message}
            {...register("description")}
          />
          <p className="mt-1 text-xs text-text-muted">
            Nội dung này hiển thị trực tiếp tại phần đầu giới thiệu trang Về chúng tôi.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
