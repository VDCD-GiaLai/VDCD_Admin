"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { FormInput, FormTextarea, FormCheckbox, AppButton } from "@/components/ui";
import { useToast } from "@/components/ui";
import { RichTextEditor } from "@/components/shared";
import { useCreateArticle } from "@/features/articles/api";
import { useProjects } from "@/features/projects/api";
import { usePrograms } from "@/features/programs/api";
import { useSolutions } from "@/features/solutions/api";
import { articleSchema, type ArticleFormData } from "@/features/articles/schema";
import { uploadImage, validateImageFile } from "@/lib/upload";

export default function CreateArticlePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateArticle();

  // Load lists for linking
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: programsData } = usePrograms({ limit: 100 });
  const { data: solutionsData } = useSolutions({ limit: 100 });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [richContent, setRichContent] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      thumbnail: "",
      thumbnailFileId: null,
      category: "",
      tags: "",
      projectId: null,
      programId: null,
      solutionId: null,
      metaTitle: "",
      metaDescription: "",
      isPublished: false,
      publishedAt: null,
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast({ title: "File không hợp lệ", description: error, color: "danger" });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file, "image");
      setValue("thumbnail", result.url);
      setValue("thumbnailFileId", result.fileId);
      setPreviewUrl(result.url);
      toast({ title: "Tải ảnh thành công", color: "success" });
    } catch {
      toast({ title: "Tải ảnh thất bại", color: "danger" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: ArticleFormData) => {
    // Treat empty string fields for IDs as null
    const payload = {
      ...data,
      content: richContent,
      projectId: data.projectId || null,
      programId: data.programId || null,
      solutionId: data.solutionId || null,
      publishedAt: data.publishedAt || null,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Tạo bài viết thành công", color: "success" });
        router.push("/articles");
      },
      onError: (error) => {
        toast({ title: "Tạo thất bại", description: error.message, color: "danger" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Thêm bài viết</h1>
          <p className="text-sm text-text-muted">Tạo bài viết truyền thông hoặc tin tức mới.</p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>← Quay lại</AppButton>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Nội dung</CardTitle>
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    Nội dung chi tiết
                  </label>
                  <RichTextEditor
                    content={richContent}
                    onChange={setRichContent}
                    placeholder="Viết nội dung bài báo..."
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Phân loại & Liên kết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Danh mục (Category)"
                    errorMessage={errors.category?.message}
                    {...register("category")}
                  />
                  <FormInput
                    label="Thẻ (Tags)"
                    helperText="Phân cách bằng dấu phẩy"
                    errorMessage={errors.tags?.message}
                    {...register("tags")}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">Liên kết dự án</label>
                    <select
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                      {...register("projectId")}
                      defaultValue=""
                    >
                      <option value="">— Không liên kết —</option>
                      {projectsData?.items.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">Liên kết chương trình</label>
                    <select
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                      {...register("programId")}
                      defaultValue=""
                    >
                      <option value="">— Không liên kết —</option>
                      {programsData?.items.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text">Liên kết giải pháp</label>
                    <select
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                      {...register("solutionId")}
                      defaultValue=""
                    >
                      <option value="">— Không liên kết —</option>
                      {solutionsData?.items.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Xuất bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <FormCheckbox label="Xuất bản ngay" {...register("isPublished")} />
                <div>
                  <FormInput
                    type="datetime-local"
                    label="Ngày xuất bản"
                    helperText="Nếu để trống, sẽ lấy giờ hiện tại khi xuất bản"
                    errorMessage={errors.publishedAt?.message}
                    {...register("publishedAt")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">Ảnh đại diện</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {previewUrl && (
                  <div className="overflow-hidden rounded-md border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="h-40 w-full object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
                />
                {uploading && <p className="text-xs text-primary">Đang tải ảnh...</p>}
                <input type="hidden" {...register("thumbnail")} />
                <input type="hidden" {...register("thumbnailFileId")} />
              </CardContent>
            </Card>

            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <FormInput
                  label="Meta Title"
                  helperText="Tối đa 60 ký tự"
                  errorMessage={errors.metaTitle?.message}
                  {...register("metaTitle")}
                />
                <FormTextarea
                  label="Meta Description"
                  rows={2}
                  helperText="Tối đa 160 ký tự"
                  errorMessage={errors.metaDescription?.message}
                  {...register("metaDescription")}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <AppButton variant="ghost" type="button" onClick={() => router.back()}>Huỷ</AppButton>
          <AppButton type="submit" isLoading={createMutation.isPending}>
            Tạo bài viết
          </AppButton>
        </div>
      </form>
    </div>
  );
}
