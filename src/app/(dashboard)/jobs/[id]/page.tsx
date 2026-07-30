"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormCheckbox, AppButton, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui";
import { RichTextEditor } from "@/components/shared";
import { useJob, useUpdateJob } from "@/features/jobs/api";
import { jobSchema, type JobFormData } from "@/features/jobs/schema";
import { format } from "date-fns";

/**
 * Edit Job page — UC-JOB-06.
 */
export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: job, isLoading } = useJob(id);
  const updateMutation = useUpdateJob(id);

  const [descriptionContent, setDescriptionContent] = useState("");
  const [requirementsContent, setRequirementsContent] = useState("");
  const [benefitsContent, setBenefitsContent] = useState("");
  const [contentInitialized, setContentInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      slug: "",
      department: "",
      location: "",
      type: "full-time",
      salaryRange: "",
      deadline: "",
      description: "",
      requirements: "",
      benefits: "",
      isUrgent: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        slug: job.slug,
        department: job.department ?? "",
        location: job.location ?? "",
        type: job.type,
        salaryRange: job.salaryRange ?? "",
        deadline: job.deadline ? format(new Date(job.deadline), "yyyy-MM-dd") : "",
        description: job.description ?? "",
        requirements: job.requirements ?? "",
        benefits: job.benefits ?? "",
        isUrgent: job.isUrgent,
        isActive: job.isActive,
      });
      if (!contentInitialized) {
        setDescriptionContent(job.description ?? "");
        setRequirementsContent(job.requirements ?? "");
        setBenefitsContent(job.benefits ?? "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setContentInitialized(true);
      }
    }
  }, [job, reset, contentInitialized]);

  const onSubmit = (data: JobFormData) => {
    updateMutation.mutate(
      {
        ...data,
        description: descriptionContent,
        requirements: requirementsContent,
        benefits: benefitsContent,
      },
      {
        onSuccess: () => {
          toast({ title: "Cập nhật thành công", color: "success" });
          router.push("/jobs");
        },
        onError: (error) => {
          toast({ title: "Cập nhật thất bại", description: error.message, color: "danger" });
        },
      }
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Sửa vị trí tuyển dụng</h1>
          <p className="text-sm text-text-muted">Cập nhật thông tin vị trí {job?.title}.</p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>← Quay lại</AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Thông tin chính</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <FormInput
                  label="Tiêu đề"
                  isRequired
                  errorMessage={errors.title?.message}
                  {...register("title")}
                />
                <FormInput
                  label="Slug (URL)"
                  helperText="Để trống để tự động tạo từ tiêu đề"
                  errorMessage={errors.slug?.message}
                  {...register("slug")}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Phòng ban"
                    errorMessage={errors.department?.message}
                    {...register("department")}
                  />
                  <FormInput
                    label="Địa điểm làm việc"
                    errorMessage={errors.location?.message}
                    {...register("location")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Mức lương"
                    placeholder="VD: 10 - 15 triệu"
                    errorMessage={errors.salaryRange?.message}
                    {...register("salaryRange")}
                  />
                  <FormInput
                    label="Hạn nộp hồ sơ"
                    type="date"
                    errorMessage={errors.deadline?.message}
                    {...register("deadline")}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Mô tả công việc
                  </label>
                  <RichTextEditor
                    content={descriptionContent}
                    onChange={setDescriptionContent}
                    placeholder="Nhập mô tả công việc..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Yêu cầu ứng viên
                  </label>
                  <RichTextEditor
                    content={requirementsContent}
                    onChange={setRequirementsContent}
                    placeholder="Nhập yêu cầu ứng viên..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Quyền lợi
                  </label>
                  <RichTextEditor
                    content={benefitsContent}
                    onChange={setBenefitsContent}
                    placeholder="Nhập quyền lợi..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Phân loại & Trạng thái</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Loại hình công việc
                  </label>
                  <select
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                    {...register("type")}
                  >
                    <option value="full-time">Toàn thời gian</option>
                    <option value="part-time">Bán thời gian</option>
                    <option value="intern">Thực tập sinh</option>
                  </select>
                  {errors.type && <p className="mt-1 text-xs text-danger">{errors.type.message}</p>}
                </div>
                
                <FormCheckbox label="Tuyển gấp (Hiển thị badge)" {...register("isUrgent")} />
                <FormCheckbox label="Đang mở tuyển dụng" {...register("isActive")} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          {isDirty && <p className="text-xs text-warning">Có thay đổi chưa lưu</p>}
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton
            type="submit"
            isLoading={updateMutation.isPending}
            disabled={
              !isDirty && 
              descriptionContent === (job?.description ?? "") &&
              requirementsContent === (job?.requirements ?? "") &&
              benefitsContent === (job?.benefits ?? "")
            }
          >
            Lưu thay đổi
          </AppButton>
        </div>
      </form>
    </div>
  );
}
