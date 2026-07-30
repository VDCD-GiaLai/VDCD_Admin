"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { useGlobalSearch } from "@/hooks/useSearch";
import { Spinner } from "@/components/ui/Spinner";
import type { SearchResultItem } from "@/types/search";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  programs: "Chương trình",
  solutions: "Giải pháp",
  projects: "Dự án",
  articles: "Tin tức & Bài viết",
  jobs: "Cơ hội việc làm",
  leads: "Liên hệ (Leads)",
  "admin-users": "Quản trị viên",
};

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useGlobalSearch({ q: debouncedSearch });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  const handleNavigate = (url: string) => {
    handleClose();
    router.push(url);
  };

  const hasResults =
    data && Object.values(data).some((arr) => arr && arr.length > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      placement="top"
      hideCloseButton
    >
      <div className="flex flex-col bg-surface overflow-hidden w-full max-h-[85vh]">
        {/* Search Input Area */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <SearchIcon className="h-5 w-5 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent px-3 py-1.5 text-base text-text placeholder:text-text-muted focus:outline-none"
            placeholder="Tìm kiếm chương trình, dự án, tin tức..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isFetching && (
            <div className="shrink-0 ml-2">
              <Spinner size="sm" />
            </div>
          )}
          <div className="ml-2 flex shrink-0 items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-text-muted">
            <span>Esc</span>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {!searchTerm && (
            <div className="py-12 text-center text-sm text-text-muted">
              Nhập từ khóa để bắt đầu tìm kiếm
            </div>
          )}

          {searchTerm && !isFetching && !hasResults && (
            <div className="py-12 text-center text-sm text-text-muted">
              Không tìm thấy kết quả nào cho &quot;{searchTerm}&quot;
            </div>
          )}

          {hasResults && (
            <div className="space-y-4 pb-2">
              {Object.entries(data).map(([type, items]) => {
                if (!items || items.length === 0) return null;
                return (
                  <div key={type} className="px-2">
                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                      {TYPE_LABELS[type] ?? type}
                    </h3>
                    <ul className="space-y-1">
                      {items.map((item: SearchResultItem) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleNavigate(item.url)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-text hover:bg-primary/5 hover:text-primary transition-colors focus:bg-primary/5 focus:text-primary focus:outline-none"
                          >
                            <span className="shrink-0 text-text-muted opacity-60">
                              <ResultIcon type={type} />
                            </span>
                            <span className="truncate flex-1">{item.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Inline Icons ──────────────────────────────────────────────

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx={11} cy={11} r={8} />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ResultIcon({ type }: { type: string }) {
  // Simple switch for generic icons based on entity type
  switch (type) {
    case "programs":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="m3 15 2 2 4-4"/></svg>
      );
    case "solutions":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      );
    case "projects":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
      );
    case "articles":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      );
    case "jobs":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      );
    case "leads":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
      );
    case "admin-users":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      );
  }
}
