"use client";

import React, { useState, useEffect } from "react";

export interface FloatingSaveBarProps {
  /**
   * Điều khiển hiển thị thanh thao tác nổi.
   * Thường kích hoạt khi isDirty === true và đang ở tab chỉnh sửa.
   */
  isVisible: boolean;
  /**
   * Nhãn văn bản thông báo trạng thái thay đổi.
   * Mặc định là: "Có thay đổi chưa lưu"
   */
  statusText?: string;
  /**
   * Danh sách nút thao tác (ví dụ: Hoàn tác, Lưu thay đổi...).
   */
  children: React.ReactNode;
  /**
   * Tuỳ biến class container nếu cần.
   */
  className?: string;
  /**
   * Ref trỏ tới thanh lưu cố định ở đáy trang.
   * Khi thanh này xuất hiện trong viewport, FloatingSaveBar sẽ tự động ẩn đi để tránh trùng lặp.
   */
  hideWhenInViewRef?: React.RefObject<HTMLElement | null>;
  /**
   * CSS selector phần tử đáy trang cần theo dõi (mặc định: "[data-bottom-save-bar]").
   * Sẽ được dùng nếu hideWhenInViewRef không được cung cấp.
   */
  hideWhenInViewSelector?: string;
}

/**
 * FloatingSaveBar — Thanh thao tác lưu bài viết/biểu mẫu cố định ở góc dưới bên phải màn hình.
 *
 * Tự động nổi lên khi có thay đổi dữ liệu (isDirty) giúp người dùng lưu nhanh
 * dù biểu mẫu kéo dài nhiều khối mà không cần phải cuộn xuống đáy trang.
 * Tự động ẩn đi khi thanh lưu ở đáy trang xuất hiện trong viewport.
 */
export function FloatingSaveBar({
  isVisible,
  statusText = "Có thay đổi chưa lưu",
  children,
  className = "",
  hideWhenInViewRef,
  hideWhenInViewSelector = "[data-bottom-save-bar]",
}: FloatingSaveBarProps) {
  const [isBottomBarInView, setIsBottomBarInView] = useState(false);

  useEffect(() => {
    if (!isVisible || typeof window === "undefined") {
      return;
    }

    let observer: IntersectionObserver | null = null;
    let isCleanedUp = false;
    const intersectingMap = new Map<Element, boolean>();

    const getTargets = (): HTMLElement[] => {
      if (hideWhenInViewRef?.current) {
        return [hideWhenInViewRef.current];
      }
      if (hideWhenInViewSelector) {
        return Array.from(
          document.querySelectorAll<HTMLElement>(hideWhenInViewSelector)
        );
      }
      return [];
    };

    const isElementInViewport = (el: HTMLElement): boolean => {
      if (!el.isConnected) return false;
      // If hidden with display: none or parent is hidden (offsetParent is null unless fixed)
      if (el.offsetParent === null && window.getComputedStyle(el).position !== "fixed") {
        return false;
      }
      const rect = el.getBoundingClientRect();
      if (rect.height === 0 && rect.width === 0) return false;
      const windowHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      // In viewport if top entered the viewport and bottom is still below or in view
      return rect.top <= windowHeight && rect.bottom >= 0;
    };

    const updateVisibility = () => {
      if (isCleanedUp) return;
      const targets = getTargets();

      // Check IntersectionObserver records first
      let anyIntersecting = false;
      for (const val of intersectingMap.values()) {
        if (val) {
          anyIntersecting = true;
          break;
        }
      }

      // Also check bounding rect directly for all targets (covers tab switching, fast scroll, hidden parents)
      const anyInView = anyIntersecting || targets.some(isElementInViewport);
      setIsBottomBarInView(anyInView);
    };

    const attachObservers = () => {
      const targets = getTargets();
      if (targets.length === 0) return;

      if ("IntersectionObserver" in window) {
        if (observer) {
          observer.disconnect();
        }
        observer = new IntersectionObserver(
          (entries) => {
            if (isCleanedUp) return;
            entries.forEach((entry) => {
              intersectingMap.set(entry.target, entry.isIntersecting);
            });
            updateVisibility();
          },
          {
            root: null,
            threshold: 0,
            rootMargin: "0px 0px 50px 0px",
          }
        );
        targets.forEach((el) => observer!.observe(el));
      }

      updateVisibility();
    };

    attachObservers();

    // Scroll & Resize listeners for instant response
    const handleScroll = () => {
      updateVisibility();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // MutationObserver to detect tab switches or dynamic DOM additions
    let mutationObserver: MutationObserver | null = null;
    if ("MutationObserver" in window) {
      mutationObserver = new MutationObserver(() => {
        attachObservers();
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "hidden"],
      });
    }

    return () => {
      isCleanedUp = true;
      if (observer) observer.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isVisible, hideWhenInViewRef, hideWhenInViewSelector]);

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Thao tác lưu nhanh bài viết"
      aria-hidden={isBottomBarInView}
      inert={isBottomBarInView ? true : undefined}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-border bg-surface/95 px-4 py-2.5 shadow-xl backdrop-blur-md transition-all duration-300 ease-in-out ${
        isBottomBarInView
          ? "pointer-events-none translate-y-6 opacity-0 scale-95"
          : "pointer-events-auto translate-y-0 opacity-100 scale-100 animate-in fade-in slide-in-from-bottom-3"
      } ${className}`}
    >
      <div className="flex items-center gap-2 border-r border-border pr-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-warning" />
        </span>
        <span className="text-xs font-medium text-text-muted select-none whitespace-nowrap">
          {statusText}
        </span>
      </div>

      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

