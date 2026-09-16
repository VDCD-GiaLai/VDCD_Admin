"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { AppButton, Spinner, Badge } from "@/components/ui";
import { AttachmentViewer } from "@/components/shared";
import { useContact } from "@/features/contacts/api";

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
 * Contact Details page — replicates the applicant (Lead) UX.
 * Automatically marks as read when fetching (handled by backend).
 */
export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contact, isLoading } = useContact(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-text-muted">Không tìm thấy liên hệ này.</p>
        <AppButton onClick={() => router.push("/contacts")}>Quay lại danh sách</AppButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Chi tiết liên hệ</h1>
          <p className="text-sm text-text-muted">
            Gửi lúc {format(new Date(contact.createdAt), "HH:mm dd/MM/yyyy")}
          </p>
        </div>
        <AppButton variant="ghost" onClick={() => router.back()}>
          ← Quay lại
        </AppButton>
      </div>

      {/* 2-column info grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Message content */}
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
                <p className="mt-1 break-all text-sm text-text">
                  {contact.subject || "Không có chủ đề"}
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-text">Nội dung lời nhắn:</h3>
                <div className="mt-2 whitespace-pre-wrap break-all rounded-md bg-surface-muted p-4 text-sm text-text">
                  {contact.message || "Không có nội dung lời nhắn."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sender info */}
        <div className="space-y-6">
          <Card className="border border-border bg-surface shadow-sm">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-base font-semibold text-text">
                Thông tin người gửi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <InfoRow label="Họ và tên" value={contact.fullName} />
              <InfoRow
                label="Email"
                value={
                  <a
                    href={`mailto:${contact.email}`}
                    className="break-all text-primary hover:underline"
                  >
                    {contact.email}
                  </a>
                }
              />
              <InfoRow
                label="Số điện thoại"
                value={
                  contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-primary hover:underline"
                    >
                      {contact.phone}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <div>
                <p className="text-xs text-text-muted">Trạng thái</p>
                <div className="mt-1">
                  <Badge
                    color={contact.isRead ? "secondary" : "warning"}
                    variant="soft"
                  >
                    {contact.isRead ? "Đã đọc" : "Chưa đọc"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attachment Viewer — full width below grid, matching leads */}
      {contact.attachment && (
        <Card className="border border-border bg-surface shadow-sm">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Tài liệu đính kèm
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <AttachmentViewer
              url={contact.attachment}
              title={`Đính kèm - ${contact.fullName}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
