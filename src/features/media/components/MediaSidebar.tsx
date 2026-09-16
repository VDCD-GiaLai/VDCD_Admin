"use client";

import React from "react";
import { PRESET_FOLDERS } from "@/hooks/useGallery";

interface MediaSidebarProps {
  currentFolder: string;
  onSelectFolder: (path: string) => void;
}

export function MediaSidebar({
  currentFolder,
  onSelectFolder,
}: MediaSidebarProps) {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface p-3 sm:w-64">
      <div className="mb-2.5 px-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          Thư mục lưu trữ
        </h2>
      </div>

      <nav className="space-y-1">
        {PRESET_FOLDERS.map((folder) => {
          const isActive = currentFolder === folder.path;
          return (
            <button
              key={folder.path}
              type="button"
              onClick={() => onSelectFolder(folder.path)}
              className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary shadow-xs"
                  : "text-text-muted hover:bg-surface-muted hover:text-text"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? "text-primary" : "text-text-muted/60 group-hover:text-text"
                }`}
              >
                <path d="M2 4.75A2.75 2.75 0 0 1 4.75 2h3.11c.73 0 1.43.29 1.94.81l1.39 1.39c.26.26.6.4.97.4h3.09A2.75 2.75 0 0 1 18 7.35v7.9A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25V4.75Z" />
              </svg>
              <span className="truncate">{folder.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
