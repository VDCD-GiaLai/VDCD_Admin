"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton, useToast, Spinner } from "@/components/ui";
import { FloatingSaveBar } from "@/components/shared";
import { usePermission } from "@/hooks/usePermission";
import {
  useOrganization,
  useUpdateOrganization,
} from "@/features/organization/api";
import {
  organizationSchema,
  type OrganizationFormData,
} from "@/features/organization/schema";
import {
  GeneralInfoSection,
  AnnouncementSection,
  LeaderSection,
  VisionValuesSection,
  StatsSection,
  EcosystemSection,
  CtaContactSection,
} from "@/features/organization/components";
import type { Organization } from "@/types/organization";

type TabKey =
  | "general"
  | "leader"
  | "vision-values"
  | "stats"
  | "ecosystem"
  | "cta-contact";

interface TabItem {
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: string;
  badgeCount?: number;
}

export default function OrganizationPage() {
  const { toast } = useToast();
  const canUpdate = usePermission("organization:update");
  const { data: org, isLoading } = useOrganization();
  const updateMutation = useUpdateOrganization();

  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<OrganizationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(organizationSchema) as any,
    defaultValues: {
      name: "",
      shortName: "",
      tagline: "",
      businessLicenseNo: "",
      description: "",
      mission: "",
      vision: "",
      coreValues: "",
      coreValuesList: [],
      foundedYear: null,
      address: "",
      email: "",
      hotline: "",
      announcement: {
        text: "",
        link: "",
        isActive: true,
        imageUrl: "",
        imageFileId: "",
      },
      leader: {
        name: "",
        role: "",
        quote: "",
        avatarUrl: "",
        avatarFileId: "",
        ctaText: "",
        ctaLink: "",
      },
      stats: {
        staff: 0,
        experts: 0,
        provinces: 0,
        projects: 0,
      },
      statsList: [],
      ecosystemCapabilities: "",
      ecosystemMembersArray: [],
      developmentOrientationsArray: [],
      operationFieldsArray: [],
      ctaSection: {
        badge: "",
        title: "",
        description: "",
        buttonText: "",
        buttonLink: "",
        secondaryButtonText: "",
        secondaryButtonLink: "",
        subtext: "",
      },
      socialLinksArray: [],
    },
  });

  // ── Populate form from API ──
  const populateForm = useCallback(
    (currentOrg: Organization) => {
      // Social links array
      const socialLinksArray = Object.entries(currentOrg.socialLinks || {}).map(
        ([platform, url]) => ({
          platform,
          url: url as string,
        })
      );

      // Orientations array
      const developmentOrientationsArray = (
        currentOrg.developmentOrientations || []
      ).map((item, idx) => ({
        title: item.title || "",
        description: item.description || "",
        icon: item.icon || "compass",
        order: item.order ?? idx + 1,
      }));

      // Operation fields array
      const operationFieldsArray = (currentOrg.operationFields || []).map(
        (item, idx) => ({
          title: item.title || "",
          description: item.description || "",
          icon: item.icon || "layers",
          imageUrl: item.imageUrl || "",
          order: item.order ?? idx + 1,
        })
      );

      // Ecosystem members array
      const ecosystemMembersArray = (currentOrg.ecosystemMembers || []).map(
        (m, idx) => ({
          id: m.id,
          title: m.title || "",
          slug: m.slug || "",
          description: m.description || "",
          imageUrl: m.imageUrl || "",
          websiteUrl: m.websiteUrl || "",
          order: m.order ?? idx + 1,
        })
      );

      // Stats list
      let statsList = currentOrg.statsList || [];
      if (statsList.length === 0 && currentOrg.stats) {
        // Fallback convert from legacy stats object if statsList is not yet populated
        statsList = [
          {
            key: "staff",
            value: `${currentOrg.stats.staff ?? 1500}+`,
            label: "Nhân sự",
            description:
              "Đội ngũ chuyên môn cao, đáp ứng triển khai dự án quy mô lớn",
            icon: "users",
          },
          {
            key: "experts",
            value: `${currentOrg.stats.experts ?? 250}+`,
            label: "Chuyên gia",
            description: "Năng lực R&D phần cứng, GIS, AI và chuyển đổi số",
            icon: "award",
          },
          {
            key: "projects",
            value: `${currentOrg.stats.projects ?? 100}+`,
            label: "Dự án",
            description:
              "Tham gia trực tiếp triển khai các dự án quy mô toàn quốc",
            icon: "briefcase",
          },
          {
            key: "provinces",
            value: `${currentOrg.stats.provinces ?? 30}+`,
            label: "Tỉnh thành",
            description:
              "Mạng lưới phục vụ thực địa rộng khắp các tỉnh thành toàn quốc",
            icon: "map-pin",
          },
        ];
      }

      reset({
        name: currentOrg.name || "",
        shortName: currentOrg.shortName ?? "",
        tagline: currentOrg.tagline ?? "",
        businessLicenseNo: currentOrg.businessLicenseNo ?? "",
        description: currentOrg.description ?? "",
        mission: currentOrg.mission ?? "",
        vision: currentOrg.vision ?? "",
        coreValues: currentOrg.coreValues ?? "",
        coreValuesList: currentOrg.coreValuesList ?? [],
        foundedYear: currentOrg.foundedYear ?? null,
        address: currentOrg.address ?? "",
        email:
          currentOrg.email ??
          (currentOrg.socialLinks?.email as string) ??
          "",
        hotline:
          currentOrg.hotline ??
          (currentOrg.socialLinks?.hotline as string) ??
          "",
        announcement: currentOrg.announcement
          ? {
              text: currentOrg.announcement.text ?? "",
              link: currentOrg.announcement.link ?? "",
              isActive: currentOrg.announcement.isActive ?? true,
              imageUrl: currentOrg.announcement.imageUrl ?? "",
              imageFileId: currentOrg.announcement.imageFileId ?? "",
            }
          : {
              text: "",
              link: "",
              isActive: true,
              imageUrl: "",
              imageFileId: "",
            },
        leader: currentOrg.leader ?? {
          name: "",
          role: "",
          quote: "",
          avatarUrl: "",
          avatarFileId: "",
          ctaText: "",
          ctaLink: "",
        },
        stats: {
          staff: currentOrg.stats?.staff ?? 0,
          experts: currentOrg.stats?.experts ?? 0,
          provinces: currentOrg.stats?.provinces ?? 0,
          projects: currentOrg.stats?.projects ?? 0,
        },
        statsList,
        ecosystemCapabilities: currentOrg.ecosystemCapabilities ?? "",
        ecosystemMembersArray,
        developmentOrientationsArray,
        operationFieldsArray,
        ctaSection: currentOrg.ctaSection
          ? {
              badge: currentOrg.ctaSection.badge ?? "",
              title: currentOrg.ctaSection.title ?? "",
              description: currentOrg.ctaSection.description ?? "",
              buttonText: currentOrg.ctaSection.buttonText ?? "",
              buttonLink: currentOrg.ctaSection.buttonLink ?? "",
              secondaryButtonText:
                currentOrg.ctaSection.secondaryButtonText ?? "",
              secondaryButtonLink:
                currentOrg.ctaSection.secondaryButtonLink ?? "",
              subtext: currentOrg.ctaSection.subtext ?? "",
            }
          : {
              badge: "",
              title: "",
              description: "",
              buttonText: "",
              buttonLink: "",
              secondaryButtonText: "",
              secondaryButtonLink: "",
              subtext: "",
            },
        socialLinksArray,
      });
    },
    [reset]
  );

  useEffect(() => {
    if (org) {
      populateForm(org);
    }
  }, [org, populateForm]);

  // ── Handle Submit ──
  const onSubmit = (data: OrganizationFormData) => {
    // 1. Transform socialLinksArray -> Record<string, string>
    const socialLinks =
      data.socialLinksArray?.reduce(
        (acc, curr) => {
          if (curr.platform && curr.url) {
            acc[curr.platform] = curr.url;
          }
          return acc;
        },
        {} as Record<string, string>
      ) ?? {};

    // Sync direct email and hotline into socialLinks as well
    if (data.email) socialLinks.email = data.email;
    if (data.hotline) socialLinks.hotline = data.hotline;

    // 2. Transform developmentOrientationsArray
    const developmentOrientations = (
      data.developmentOrientationsArray || []
    ).map((item, idx) => ({
      title: item.title,
      description: item.description || "",
      icon: item.icon || "compass",
      order: item.order ?? idx + 1,
    }));

    // 3. Transform operationFieldsArray
    const operationFields = (data.operationFieldsArray || []).map(
      (item, idx) => ({
        title: item.title,
        description: item.description || "",
        icon: item.icon || "layers",
        imageUrl: item.imageUrl || "",
        order: item.order ?? idx + 1,
      })
    );

    // 4. Transform ecosystemMembersArray
    const ecosystemMembers = (data.ecosystemMembersArray || []).map(
      (item, idx) => ({
        id: item.id,
        title: item.title,
        slug: item.slug || "",
        description: item.description || "",
        imageUrl: item.imageUrl || "",
        websiteUrl: item.websiteUrl || "",
        order: item.order ?? idx + 1,
      })
    );

    // 5. Sync stats numeric values from statsList
    const stats = {
      staff: data.stats?.staff ?? 0,
      experts: data.stats?.experts ?? 0,
      provinces: data.stats?.provinces ?? 0,
      projects: data.stats?.projects ?? 0,
    };
    (data.statsList || []).forEach((item, idx) => {
      // Remove dots/commas to parse 1.500+ -> 1500 correctly
      const cleanValue = item.value?.replace(/[.,\s]/g, "") || "";
      const numMatch = cleanValue.match(/\d+/);
      const parsedNum = numMatch ? parseInt(numMatch[0], 10) : 0;
      const labelLower = (item.label || "").toLowerCase();

      if (item.key === "staff" || idx === 0 || labelLower.includes("nhân sự") || labelLower.includes("cán bộ")) {
        stats.staff = parsedNum;
      } else if (item.key === "experts" || idx === 1 || labelLower.includes("chuyên gia")) {
        stats.experts = parsedNum;
      } else if (item.key === "projects" || idx === 2 || labelLower.includes("dự án")) {
        stats.projects = parsedNum;
      } else if (item.key === "provinces" || idx === 3 || labelLower.includes("tỉnh")) {
        stats.provinces = parsedNum;
      }
    });

    // 6. Build final payload
    const cleanRest = { ...data } as Record<string, unknown>;
    delete cleanRest.socialLinksArray;
    delete cleanRest.developmentOrientationsArray;
    delete cleanRest.operationFieldsArray;
    delete cleanRest.ecosystemMembersArray;

    const payload: Partial<Organization> = {
      ...cleanRest,
      stats,
      socialLinks,
      developmentOrientations,
      operationFields,
      ecosystemMembers,
    };

    updateMutation.mutate(payload, {
      onSuccess: (updated) => {
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin tổ chức và trang Về chúng tôi đã được lưu.",
          color: "success",
        });
        if (updated) {
          populateForm(updated);
        }
      },
      onError: (error) => {
        toast({
          title: "Cập nhật thất bại",
          description: error.message || "Vui lòng kiểm tra lại các trường dữ liệu.",
          color: "danger",
        });
      },
    });
  };

  // ── Tab items configuration ──
  const tabs: TabItem[] = useMemo(
    () => [
      {
        key: "general",
        label: "Thông tin & Thông báo",
        shortLabel: "Chung & Thông báo",
        icon: "🏢",
      },
      {
        key: "leader",
        label: "Thông điệp Lãnh đạo",
        shortLabel: "Lãnh đạo",
        icon: "👤",
      },
      {
        key: "vision-values",
        label: "Tầm nhìn & Năng lực trọng tâm",
        shortLabel: "Tầm nhìn & Năng lực",
        icon: "🎯",
      },
      {
        key: "stats",
        label: "Mạng lưới & Quy mô",
        shortLabel: "Thống kê",
        icon: "📊",
      },
      {
        key: "ecosystem",
        label: "Hệ sinh thái VDCD",
        shortLabel: "Hệ sinh thái (12)",
        icon: "🌐",
      },
      {
        key: "cta-contact",
        label: "CTA & Liên hệ",
        shortLabel: "CTA & Liên hệ",
        icon: "📞",
      },
    ],
    []
  );

  // Tab error indicators
  const tabErrors = useMemo(() => {
    return {
      general: Boolean(
        errors.name ||
          errors.shortName ||
          errors.tagline ||
          errors.businessLicenseNo ||
          errors.foundedYear ||
          errors.address ||
          errors.description ||
          errors.announcement
      ),
      leader: Boolean(errors.leader),
      "vision-values": Boolean(
        errors.mission ||
          errors.vision ||
          errors.coreValues ||
          errors.developmentOrientationsArray
      ),
      stats: Boolean(errors.stats || errors.statsList),
      ecosystem: Boolean(
        errors.ecosystemCapabilities || errors.ecosystemMembersArray
      ),
      "cta-contact": Boolean(
        errors.ctaSection ||
          errors.email ||
          errors.hotline ||
          errors.socialLinksArray
      ),
    };
  }, [errors]);

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ════════════════════════════════════════════
          Page Header
      ════════════════════════════════════════════ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text">
              Quản lý Tổ chức & Trang Về chúng tôi
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Live Sync
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Quản trị 100% các khối nội dung hiển thị trên trang &ldquo;Về chúng tôi&rdquo; (/about-us).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3002/about-us"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text shadow-sm transition-colors hover:bg-surface-muted"
          >
            <span>🌐 Xem trang thực tế</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5 text-text-muted"
            >
              <path
                fillRule="evenodd"
                d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h4a.75.75 0 010 1.5h-4z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.156 8.497a.75.75 0 00-.053 1.06z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          {canUpdate && (
            <AppButton
              type="button"
              isLoading={updateMutation.isPending}
              disabled={!isDirty || updateMutation.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              Lưu thay đổi
            </AppButton>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          Modern Segmented Tabs Navigation
      ════════════════════════════════════════════ */}
      <div className="flex overflow-x-auto rounded-xl border border-border bg-surface p-1.5 shadow-sm scrollbar-none">
        <div className="flex min-w-full gap-1">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            const hasError = tabErrors[tab.key];

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-1 shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
                {hasError && (
                  <span className="flex h-2 w-2 rounded-full bg-danger" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          Form Content Tabs
      ════════════════════════════════════════════ */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab 1: Thông tin chung & Thông báo */}
        <div className={activeTab === "general" ? "space-y-6" : "hidden"}>
          <GeneralInfoSection register={register} errors={errors} />
          <AnnouncementSection
            register={register}
            setValue={setValue}
            control={control}
            errors={errors}
          />
        </div>

        {/* Tab 2: Thông điệp Lãnh đạo */}
        <div className={activeTab === "leader" ? "space-y-6" : "hidden"}>
          <LeaderSection
            register={register}
            setValue={setValue}
            control={control}
            errors={errors}
          />
        </div>

        {/* Tab 3: Tầm nhìn & Giá trị cốt lõi / Chức năng trọng tâm */}
        <div className={activeTab === "vision-values" ? "space-y-6" : "hidden"}>
          <VisionValuesSection
            register={register}
            control={control}
            errors={errors}
          />
        </div>

        {/* Tab 4: Mạng lưới & Thống kê quy mô */}
        <div className={activeTab === "stats" ? "space-y-6" : "hidden"}>
          <StatsSection
            register={register}
            control={control}
            errors={errors}
          />
        </div>

        {/* Tab 6: Hệ sinh thái VDCD & 12 Đơn vị thành viên */}
        <div className={activeTab === "ecosystem" ? "space-y-6" : "hidden"}>
          <EcosystemSection
            register={register}
            setValue={setValue}
            control={control}
            errors={errors}
          />
        </div>

        {/* Tab 7: Khối CTA & Thông tin liên hệ / Mạng xã hội */}
        <div className={activeTab === "cta-contact" ? "space-y-6" : "hidden"}>
          <CtaContactSection
            register={register}
            setValue={setValue}
            control={control}
            errors={errors}
          />
        </div>

        {/* ════════════════════════════════════════════
            Bottom Fallback Save Bar (Standard Form Footer)
        ════════════════════════════════════════════ */}
        <div
          ref={bottomBarRef}
          data-bottom-save-bar
          className="flex items-center justify-between rounded-xl border border-border bg-surface px-6 py-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            {isDirty ? (
              <span className="flex items-center gap-2 text-xs font-medium text-warning">
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                Có thay đổi chưa lưu
              </span>
            ) : (
              <span className="text-xs text-text-muted">
                Dữ liệu tổ chức đã đồng bộ với hệ thống.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                disabled={updateMutation.isPending}
                onClick={() => org && populateForm(org)}
              >
                Hoàn tác
              </AppButton>
            )}
            {canUpdate && (
              <AppButton
                type="submit"
                isLoading={updateMutation.isPending}
                disabled={!isDirty || updateMutation.isPending}
              >
                Lưu thay đổi
              </AppButton>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            Floating Action Save Bar (Always Accessible)
        ════════════════════════════════════════════ */}
        {canUpdate && (
          <FloatingSaveBar
            isVisible={isDirty}
            hideWhenInViewRef={bottomBarRef}
            statusText="Có thay đổi chưa lưu trên biểu mẫu"
          >
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() => org && populateForm(org)}
            >
              Hoàn tác
            </AppButton>
            <AppButton
              type="submit"
              size="sm"
              isLoading={updateMutation.isPending}
              disabled={updateMutation.isPending}
            >
              Lưu thay đổi
            </AppButton>
          </FloatingSaveBar>
        )}
      </form>
    </div>
  );
}
