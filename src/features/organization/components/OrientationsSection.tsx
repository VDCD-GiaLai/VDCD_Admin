"use client";

import React from "react";
import type { UseFormRegister, Control, FieldErrors } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, AppButton } from "@/components/ui";
import type { OrganizationFormData } from "../schema";

interface OrientationsSectionProps {
  register: UseFormRegister<OrganizationFormData>;
  control: Control<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
}

export function OrientationsSection({
  register,
  control,
  errors,
}: OrientationsSectionProps) {
  const {
    fields: devFields,
    append: appendDev,
    remove: removeDev,
  } = useFieldArray({
    control,
    name: "developmentOrientationsArray",
  });

  const {
    fields: opFields,
    append: appendOp,
    remove: removeOp,
  } = useFieldArray({
    control,
    name: "operationFieldsArray",
  });

  return (
    <div className="space-y-6">
      {/* Định hướng phát triển chiến lược */}
      <Card className="border border-border bg-surface shadow-sm">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                6A
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-text">
                  Định hướng phát triển chiến lược
                </CardTitle>
                <p className="text-xs text-text-muted">
                  4 định hướng trọng tâm của tổ chức (hạ tầng dữ liệu, kinh tế chủ lực, hỗ trợ startup, kết nối mạng lưới).
                </p>
              </div>
            </div>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendDev({
                  title: "",
                  description: "",
                  icon: "compass",
                  order: devFields.length + 1,
                })
              }
            >
              + Thêm định hướng
            </AppButton>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {devFields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-text-muted">
                Chưa có định hướng nào.
              </p>
              <div className="mt-3">
                <AppButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    appendDev({
                      title: "Phát triển hạ tầng dữ liệu và công nghệ dùng chung",
                      description: "Lập mô hình 3D số hóa không gian, chuẩn hóa hệ thống GIS và vận hành điện toán mây phục vụ dữ liệu số toàn tỉnh.",
                      icon: "database",
                      order: 1,
                    });
                    appendDev({
                      title: "Thúc đẩy ứng dụng công nghệ trong các ngành kinh tế chủ lực",
                      description: "Cung cấp hệ thống giám sát IOC/DOC, tự động hóa AutoTimelapse và nền tảng Digital Twin hỗ trợ quản trị và vận hành.",
                      icon: "cpu",
                      order: 2,
                    });
                    appendDev({
                      title: "Hỗ trợ startup và doanh nghiệp đổi mới mô hình hoạt động",
                      description: "Xây dựng mạng lưới liên kết giữa cơ quan quản lý, viện nghiên cứu, tập đoàn công nghệ và quỹ đầu tư trong nước.",
                      icon: "rocket",
                      order: 3,
                    });
                    appendDev({
                      title: "Kết nối Gia Lai với mạng lưới chuyên gia, công nghệ và đầu tư trong nước",
                      description: "Đào tạo nhân lực số chất lượng cao, tư vấn chuyển đổi số và chuyển giao giải pháp cho doanh nghiệp địa phương.",
                      icon: "share-2",
                      order: 4,
                    });
                  }}
                >
                  ⚡ Nạp 4 định hướng chiến lược chuẩn (/about-us)
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {devFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/30 p-4 transition-all focus-within:border-primary/50 focus-within:shadow-sm hover:border-border-strong"
                >
                  <div className="flex min-w-[28px] items-center justify-center pt-7 text-sm font-bold text-text-muted">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-5">
                      <FormInput
                        label="Tiêu đề định hướng"
                        isRequired
                        placeholder="VD: Phát triển hạ tầng dữ liệu..."
                        errorMessage={
                          errors.developmentOrientationsArray?.[index]?.title
                            ?.message
                        }
                        {...register(
                          `developmentOrientationsArray.${index}.title`
                        )}
                      />
                    </div>
                    <div className="md:col-span-7">
                      <FormTextarea
                        label="Mô tả chi tiết"
                        rows={2}
                        placeholder="Mô tả chi tiết hướng phát triển..."
                        errorMessage={
                          errors.developmentOrientationsArray?.[index]
                            ?.description?.message
                        }
                        {...register(
                          `developmentOrientationsArray.${index}.description`
                        )}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDev(index)}
                    className="mt-7 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
                    title="Xoá"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lĩnh vực hoạt động */}
      <Card className="border border-border bg-surface shadow-sm">
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                6B
              </span>
              <div>
                <CardTitle className="text-base font-semibold text-text">
                  Lĩnh vực hoạt động chính
                </CardTitle>
                <p className="text-xs text-text-muted">
                  Các mảng nghiệp vụ và giải pháp hoạt động cốt lõi của đơn vị.
                </p>
              </div>
            </div>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendOp({
                  title: "",
                  description: "",
                  icon: "layers",
                  imageUrl: "",
                  order: opFields.length + 1,
                })
              }
            >
              + Thêm lĩnh vực hoạt động
            </AppButton>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {opFields.length === 0 ? (
            <p className="text-sm text-text-muted">
              Chưa cấu hình lĩnh vực hoạt động bổ sung. (Trang Về chúng tôi ưu tiên hiển thị khối Định hướng và Hệ sinh thái).
            </p>
          ) : (
            <div className="space-y-3">
              {opFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/30 p-4"
                >
                  <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-5">
                      <FormInput
                        label="Tên lĩnh vực"
                        isRequired
                        placeholder="VD: Trắc địa số & Bản đồ GIS..."
                        errorMessage={
                          errors.operationFieldsArray?.[index]?.title?.message
                        }
                        {...register(`operationFieldsArray.${index}.title`)}
                      />
                    </div>
                    <div className="md:col-span-7">
                      <FormTextarea
                        label="Mô tả tóm tắt"
                        rows={2}
                        placeholder="Mô tả phạm vi hoạt động..."
                        errorMessage={
                          errors.operationFieldsArray?.[index]?.description
                            ?.message
                        }
                        {...register(
                          `operationFieldsArray.${index}.description`
                        )}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOp(index)}
                    className="mt-7 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10"
                    title="Xoá"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
