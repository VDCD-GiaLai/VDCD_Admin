"use client";

import { Badge } from "@/components/ui";

// ─── Types ───────────────────────────────────────────────────

export interface PublishToggleProps {
  /** Current published state */
  isPublished: boolean;
  /** Called when toggle is clicked */
  onToggle: (isPublished: boolean) => void;
  /** Show loading spinner */
  isLoading?: boolean;
}

// ─── Component ───────────────────────────────────────────────

/**
 * PublishToggle — a clickable badge that toggles publish status.
 * Shows "Đã xuất bản" (green) or "Bản nháp" (gray).
 */
export function PublishToggle({
  isPublished,
  onToggle,
  isLoading = false,
}: PublishToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!isPublished)}
      disabled={isLoading}
      className="inline-flex disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Badge
        color={isPublished ? "success" : "secondary"}
        variant="soft"
      >
        {isLoading ? "..." : isPublished ? "Đã xuất bản" : "Bản nháp"}
      </Badge>
    </button>
  );
}
