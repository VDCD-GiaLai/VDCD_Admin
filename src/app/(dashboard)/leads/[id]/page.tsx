"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { AppButton, Spinner } from "@/components/ui";
import { useLead } from "@/features/leads/api";

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
          <Card className="border border-border bg-surface shadow-sm">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                Nội dung tin nhắn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="text-sm font-semibold text-text">Chủ đề:</h3>
                <p className="mt-1 text-sm text-text">{lead.subject || "Không có chủ đề"}</p>
              </div>

              {lead.coverLetter && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-text">Thư ứng tuyển:</h3>
                  <div className="mt-2 whitespace-pre-wrap rounded-md bg-surface-muted p-4 text-sm text-text">
                    {lead.coverLetter}
                  </div>
                </div>
              )}

              {lead.message && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-text">Nội dung:</h3>
                  <div className="mt-2 whitespace-pre-wrap rounded-md bg-surface-muted p-4 text-sm text-text">
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
              
              {lead.attachment && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-text">Tài liệu đính kèm:</h3>
                  <a 
                    href={lead.attachment} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1.5 h-4 w-4">
                      <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                    </svg>
                    Tải xuống tài liệu
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border bg-surface shadow-sm">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                Thông tin người gửi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs text-text-muted">Họ và tên</p>
                <p className="font-medium text-text">{lead.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Email</p>
                <p className="text-sm font-medium text-text">{lead.email}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Số điện thoại</p>
                <p className="text-sm font-medium text-text">{lead.phone || "—"}</p>
              </div>
              {lead.dob && (
                <div>
                  <p className="text-xs text-text-muted">Ngày sinh</p>
                  <p className="text-sm font-medium text-text">
                    {format(new Date(lead.dob), "dd/MM/yyyy")}
                  </p>
                </div>
              )}
              {lead.address && (
                <div>
                  <p className="text-xs text-text-muted">Địa chỉ</p>
                  <p className="text-sm font-medium text-text">{lead.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {(lead.experienceYears || lead.expectedSalary || lead.portfolioUrl || lead.source) && (
            <Card className="border border-border bg-surface shadow-sm">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-base font-semibold text-text">
                  Thông tin ứng tuyển
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                {lead.experienceYears && (
                  <div>
                    <p className="text-xs text-text-muted">Kinh nghiệm</p>
                    <p className="text-sm font-medium text-text">{lead.experienceYears}</p>
                  </div>
                )}
                {lead.expectedSalary && (
                  <div>
                    <p className="text-xs text-text-muted">Mức lương mong muốn</p>
                    <p className="text-sm font-medium text-text">{lead.expectedSalary}</p>
                  </div>
                )}
                {lead.portfolioUrl && (
                  <div>
                    <p className="text-xs text-text-muted">Portfolio / LinkedIn</p>
                    <a
                      href={lead.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {lead.portfolioUrl}
                    </a>
                  </div>
                )}
                {lead.source && (
                  <div>
                    <p className="text-xs text-text-muted">Nguồn</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      lead.source === "career_form"
                        ? "bg-primary/10 text-primary"
                        : lead.source === "contact_form"
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success"
                    }`}>
                      {lead.source === "career_form"
                        ? "Ứng tuyển"
                        : lead.source === "contact_form"
                          ? "Liên hệ"
                          : lead.source}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
