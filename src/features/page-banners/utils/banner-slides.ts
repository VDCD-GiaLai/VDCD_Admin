import type {
  PageBanner,
  PageBannerCtaItem,
  PageBannerSlide,
} from "@/types/page-banner";
import type { PageBannerFormData, PageBannerSlideFormData } from "../schema";

/**
 * Default slides for the Careers (`careers`) hero carousel on the public frontend.
 * Used as initial fallback when the banner has not saved multi-slide data yet.
 */
export const DEFAULT_CAREERS_SLIDES: PageBannerSlide[] = [
  {
    id: "slide-1",
    tag: "Tuyển dụng",
    title: "Kiến tạo tương lai\nchuyển đổi số tại Gia Lai",
    subtitle:
      "Gia nhập VDCD Group để cùng xây dựng hệ sinh thái công nghệ tiên phong, đưa các giải pháp đổi mới sáng tạo vào phục vụ phát triển kinh tế bền vững tại khu vực Tây Nguyên.",
    imageUrl: "https://ik.imagekit.io/huy01040104/vdcd/images/IMG_9666.JPG",
    imageFileId: null,
  },
  {
    id: "slide-2",
    tag: "Môi trường",
    title: "Nơi sáng tạo\nkhông giới hạn",
    subtitle:
      "Văn phòng hiện đại, đội ngũ năng động, chế độ đãi ngộ cạnh tranh và cơ hội phát triển chuyên môn liên tục.",
    imageUrl:
      "https://ik.imagekit.io/po0s6zxoj/vdcd/solutions/doc_images/solution_image107.png?tr=w-1600,q-85,f-auto",
    imageFileId: null,
  },
  {
    id: "slide-3",
    tag: "Cơ hội",
    title: "Phát triển cùng\nTây Nguyên",
    subtitle:
      "Đóng góp trực tiếp vào hệ sinh thái số cho vùng đất đầy tiềm năng — nơi công nghệ gặp gỡ phát triển bền vững.",
    imageUrl: "https://ik.imagekit.io/huy01040104/vdcd/images/IMG_9155.jpg",
    imageFileId: null,
  },
];

/**
 * Extract stored slides from a PageBanner record.
 * Falls back to the root banner fields for Slide 1, and appends default slides 2 & 3 for `careers`
 * if no explicit slide items were saved yet.
 */
export function extractBannerSlides(
  banner?: Partial<PageBanner> | null,
): PageBannerSlideFormData[] {
  if (!banner) {
    return [];
  }

  if (Array.isArray(banner.slides) && banner.slides.length > 0) {
    return banner.slides.map((slide, idx) => ({
      id: slide.id || `slide-${idx + 1}`,
      title: slide.title ?? "",
      subtitle: slide.subtitle ?? "",
      tag: slide.tag ?? "",
      imageUrl: slide.imageUrl ?? "",
      imageFileId: slide.imageFileId ?? "",
    }));
  }

  const rawCta = Array.isArray(banner.ctaButtons) ? banner.ctaButtons : [];
  const storedSlides = rawCta.filter(
    (item): item is PageBannerCtaItem =>
      Boolean(item && item._type === "slide" && (item.imageUrl || item.href)),
  );

  if (storedSlides.length > 0) {
    return storedSlides.map((item, idx) => ({
      id: item.id || `slide-${idx + 1}`,
      title: item.title ?? item.label ?? "",
      subtitle: item.subtitle ?? "",
      tag: item.tag ?? "",
      imageUrl: item.imageUrl ?? item.href ?? "",
      imageFileId: item.imageFileId ?? "",
    }));
  }

  const firstSlide: PageBannerSlideFormData = {
    id: "slide-1",
    title: banner.title ?? DEFAULT_CAREERS_SLIDES[0].title,
    subtitle: banner.subtitle ?? DEFAULT_CAREERS_SLIDES[0].subtitle ?? "",
    tag: banner.tag ?? DEFAULT_CAREERS_SLIDES[0].tag ?? "",
    imageUrl: banner.imageUrl ?? DEFAULT_CAREERS_SLIDES[0].imageUrl,
    imageFileId: banner.imageFileId ?? "",
  };

  if (banner.pageKey === "careers") {
    return [
      firstSlide,
      ...DEFAULT_CAREERS_SLIDES.slice(1).map((slide) => ({
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle ?? "",
        tag: slide.tag ?? "",
        imageUrl: slide.imageUrl,
        imageFileId: slide.imageFileId ?? "",
      })),
    ];
  }

  return [firstSlide];
}

/**
 * Count how many slides a PageBanner currently has (including default Careers slides).
 */
export function getBannerSlideCount(banner: PageBanner): number {
  const slides = extractBannerSlides(banner);
  return slides.length;
}

/**
 * Serialize PageBannerFormData into the API payload accepted by Backend `/page-banners`.
 * Syncs root banner fields with Slide 1 and encodes all slides into `ctaButtons` JSONB.
 */
export function serializeBannerPayload(
  data: PageBannerFormData,
): Omit<PageBannerFormData, "slides"> {
  const { slides, ...rest } = data;
  const standardCtas = (rest.ctaButtons ?? []).filter(
    (item) => item._type !== "slide",
  );

  if (slides && slides.length > 0) {
    const primary = slides[0];
    const encodedSlides: PageBannerCtaItem[] = slides.map((slide, index) => ({
      _type: "slide",
      id: slide.id || `slide-${index + 1}`,
      label: slide.title || `Slide ${index + 1}`,
      href: slide.imageUrl,
      title: slide.title,
      subtitle: slide.subtitle ?? "",
      tag: slide.tag ?? "",
      imageUrl: slide.imageUrl,
      imageFileId: slide.imageFileId || null,
    }));

    return {
      ...rest,
      title: primary.title,
      subtitle: primary.subtitle ?? "",
      tag: primary.tag ?? "",
      imageUrl: primary.imageUrl,
      imageFileId: primary.imageFileId || null,
      ctaButtons: [...standardCtas, ...encodedSlides],
    };
  }

  return {
    ...rest,
    ctaButtons: standardCtas,
  };
}

