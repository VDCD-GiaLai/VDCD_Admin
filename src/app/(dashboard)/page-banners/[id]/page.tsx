"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageBannerForm } from "@/features/page-banners/components/PageBannerForm";
import { usePageBanner } from "@/features/page-banners/api";
import { Spinner } from "@/components/ui";

/**
 * Edit Page Banner page.
 */
export default function EditPageBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: banner, isLoading, error } = usePageBanner(id);

  useEffect(() => {
    if (error) {
      router.push("/page-banners");
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!banner) return null;

  return <PageBannerForm initialData={banner} />;
}
