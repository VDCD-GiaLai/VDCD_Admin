"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { AppButton, Spinner } from "@/components/ui";
import { AttachmentViewer } from "@/components/shared";
import { useLead } from "@/features/leads/api";

// ─── Info row helper ─────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-text">{value}</div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────

/**
 * Lead Details page — UC-LED-03.
 * Automatically marks as read when fetching (handled by backend).
 */
export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: lead, isLoading } = useLead(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-text-muted">Không tìm thấy liên hệ này.</p>
        <AppButton onClick={() => router.push("/leads")}>Quay lại danh sách</AppButton>
      </div>
    );
  }

  const sourceLabel =
    lead.source === "career_form"
      ? "Ứng tuyển"
      : lead.source === "contact_form"
        ? "Liên hệ"
        : lead.source || null;

  const sourceBadgeClass =
    lead.source === "career_form"
      ? "bg-primary/10 text-primary"
      : lead.source === "contact_form"
        ? "bg-warning/10 text-warning"
        : "bg-success/10 text-success";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Chi tiết liên hệ</h1>
          <p className="text-sm text-text-muted">
            Gửi lúc {format(new Date(lead.createdAt), "HH:mm dd/MM/yyyy")}
          </p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>
          ← Quay lại
        </AppButton>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Nội dung tin nhắn */}
          <Card className="border border-border bg-surface shadow-sm">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                Nội dung tin nhắn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="text-sm font-semibold text-text">Chủ đề:</h3>
                <p className="mt-1 break-all text-sm text-text">{lead.subject || "Không có chủ đề"}</p>
              </div>

              {lead.coverLetter && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-text">Thư ứng tuyển:</h3>
                  <div className="mt-2 whitespace-pre-wrap break-all rounded-md bg-surface-muted p-4 text-sm text-text">
                    {lead.coverLetter}
                  </div>
                </div>
              )}

              {lead.message && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-text">
                    {lead.coverLetter ? "Ghi chú thêm:" : "Nội dung:"}
                  </h3>
                  <div className="mt-2 whitespace-pre-wrap break-all rounded-md bg-surface-muted p-4 text-sm text-text">
                    {lead.message}
                  </div>
                </div>
              )}

              {!lead.coverLetter && !lead.message && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-text">Nội dung:</h3>
                  <div className="mt-2 whitespace-pre-wrap rounded-md bg-surface-muted p-4 text-sm text-text">
                    Không có nội dung
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Thông tin người gửi */}
          <Card className="border border-border bg-surface shadow-sm">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                Thông tin người gửi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <InfoRow label="Họ và tên" value={lead.fullName} />
              <InfoRow
                label="Email"
                value={
                  <span className="break-all">{lead.email}</span>
                }
              />
              <InfoRow label="Số điện thoại" value={lead.phone || "—"} />
              {lead.dob && (
                <InfoRow
                  label="Ngày sinh"
                  value={(() => {
                    try {
                      return format(new Date(lead.dob), "dd/MM/yyyy");
                    } catch {
                      return lead.dob;
                    }
                  })()}
                />
              )}
              <InfoRow label="Địa chỉ" value={lead.address} />
            </CardContent>
          </Card>

          {/* Thông tin ứng tuyển */}
          {(lead.experienceYears || lead.expectedSalary || lead.portfolioUrl || lead.source) && (
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">
                  Thông tin ứng tuyển
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <InfoRow label="Kinh nghiệm" value={lead.experienceYears} />
                <InfoRow label="Mức lương mong muốn" value={lead.expectedSalary} />
                {lead.portfolioUrl && (
                  <InfoRow
                    label="Portfolio / LinkedIn"
                    value={
                      <a
                        href={lead.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-primary hover:underline"
                      >
                        {lead.portfolioUrl}
                      </a>
                    }
                  />
                )}
                {sourceLabel && (
                  <div>
                    <p className="text-xs text-text-muted">Nguồn</p>
                    <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sourceBadgeClass}`}>
                      {sourceLabel}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Attachment Viewer — full width below the grid */}
      {lead.attachment && (
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Tài liệu đính kèm (CV)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <AttachmentViewer url={lead.attachment} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
