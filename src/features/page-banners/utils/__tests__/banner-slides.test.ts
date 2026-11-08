import { describe, expect, it } from "vitest";
import {
  DEFAULT_CAREERS_SLIDES,
  extractBannerSlides,
  getBannerSlideCount,
  serializeBannerPayload,
} from "../banner-slides";
import type { PageBanner } from "@/types/page-banner";

describe("banner-slides utilities", () => {
  it("populates 3 default slides for careers banner when ctaButtons has no stored slides", () => {
    const careersBanner: PageBanner = {
      id: "a3017078-5acd-4aa3-a12a-85a4d24d6f5c",
      pageKey: "careers",
      title: "Kiến tạo tương lai chuyển đổi số tại Gia Lai",
      subtitle: "Mô tả slide 1",
      tag: "Tuyển dụng",
      imageUrl: "https://ik.imagekit.io/huy01040104/vdcd/images/IMG_9666.JPG",
      imageFileId: null,
      ctaButtons: [
        { label: "Xem vị trí", href: "#positions", variant: "primary" },
      ],
      isActive: true,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    };

    const slides = extractBannerSlides(careersBanner);
    expect(slides).toHaveLength(3);
    expect(slides[0].title).toBe("Kiến tạo tương lai chuyển đổi số tại Gia Lai");
    expect(slides[1].title).toBe(DEFAULT_CAREERS_SLIDES[1].title);
    expect(slides[2].title).toBe(DEFAULT_CAREERS_SLIDES[2].title);
    expect(getBannerSlideCount(careersBanner)).toBe(3);
  });

  it("serializes slides into ctaButtons and syncs Slide 1 with root banner fields", () => {
    const payload = serializeBannerPayload({
      pageKey: "careers",
      title: "Old title",
      subtitle: "Old subtitle",
      tag: "Old tag",
      imageUrl: "https://example.com/old.jpg",
      imageFileId: "",
      ctaButtons: [
        { label: "Xem vị trí", href: "#positions", variant: "primary" },
      ],
      slides: [
        {
          id: "slide-1",
          title: "Slide 1 Mới",
          subtitle: "Sub 1",
          tag: "Tag 1",
          imageUrl: "https://example.com/1.jpg",
          imageFileId: "file-1",
        },
        {
          id: "slide-2",
          title: "Slide 2 Mới",
          subtitle: "Sub 2",
          tag: "Tag 2",
          imageUrl: "https://example.com/2.jpg",
          imageFileId: "file-2",
        },
      ],
      isActive: true,
    });

    expect(payload.title).toBe("Slide 1 Mới");
    expect(payload.imageUrl).toBe("https://example.com/1.jpg");
    expect(payload.imageFileId).toBe("file-1");
    expect("slides" in payload).toBe(false);
    expect(payload.ctaButtons).toHaveLength(3);

    const extracted = extractBannerSlides({
      ...payload,
      id: "id-1",
      createdAt: "",
      updatedAt: "",
    });
    expect(extracted).toHaveLength(2);
    expect(extracted[0].title).toBe("Slide 1 Mới");
    expect(extracted[1].title).toBe("Slide 2 Mới");
  });
});

