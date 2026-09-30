import { describe, it, expect } from "vitest";
import {
  hexToBase64,
  detectMimeFromHex,
  extractImagesFromRtf,
  replaceFileUrlsWithRtfImages,
} from "../rtfImageExtractor";

describe("rtfImageExtractor", () => {
  describe("hexToBase64", () => {
    it("converts hex to valid base64", () => {
      // "Hello" in hex: 48656c6c6f
      // But hexToBase64 requires even length
      const hex = "48656c6c6f21"; // "Hello!"
      const base64 = hexToBase64(hex);
      expect(base64).toBe("SGVsbG8h");
    });

    it("handles whitespace and linebreaks in hex", () => {
      const hex = "48 65\r\n6c 6c\n6f 21";
      const base64 = hexToBase64(hex);
      expect(base64).toBe("SGVsbG8h");
    });

    it("returns empty string for empty input", () => {
      expect(hexToBase64("")).toBe("");
    });
  });

  describe("detectMimeFromHex", () => {
    it("detects PNG magic bytes (89504E47)", () => {
      expect(detectMimeFromHex("89504e470d0a1a0a0000000d49484452")).toBe("image/png");
    });

    it("detects JPEG magic bytes (FFD8FF)", () => {
      expect(detectMimeFromHex("ffd8ffe000104a464946000101010060")).toBe("image/jpeg");
    });

    it("detects GIF magic bytes (47494638)", () => {
      expect(detectMimeFromHex("47494638396101000100800000ffffff")).toBe("image/gif");
    });
  });

  describe("extractImagesFromRtf", () => {
    it("extracts PNG images from RTF \\pict blocks", () => {
      // 100+ hex chars of a dummy PNG header
      const pngHex = "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082" + "00".repeat(20);
      const rtf = `{\\rtf1\\ansi{\\*\\generator Msftedit 5.41.21.2510;}{\\pict\\pngblip\\picw100\\pich100 ${pngHex}}}`;

      const images = extractImagesFromRtf(rtf);
      expect(images).toHaveLength(1);
      expect(images[0].mimeType).toBe("image/png");
      expect(images[0].dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it("extracts multiple images in sequence", () => {
      const img1Hex = "89504e470d0a1a0a" + "aa".repeat(60);
      const img2Hex = "ffd8ffe000104a46" + "bb".repeat(60);
      const rtf = `{\\rtf1 {\\pict\\pngblip ${img1Hex}} and text {\\pict\\jpegblip ${img2Hex}}}`;

      const images = extractImagesFromRtf(rtf);
      expect(images).toHaveLength(2);
      expect(images[0].mimeType).toBe("image/png");
      expect(images[1].mimeType).toBe("image/jpeg");
    });
  });

  describe("replaceFileUrlsWithRtfImages", () => {
    it("replaces file:/// URLs with extracted Base64 data URLs in order", () => {
      const pngHex = "89504e470d0a1a0a" + "aa".repeat(60);
      const jpegHex = "ffd8ffe000104a46" + "bb".repeat(60);
      const rtf = `{\\rtf1 {\\pict\\pngblip ${pngHex}} {\\pict\\jpegblip ${jpegHex}}}`;

      const html = `
        <p>Paragraph 1</p>
        <img src="file:///C:/Users/User/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png" alt="img1" />
        <p>Paragraph 2</p>
        <img src="file:///C:/Users/User/AppData/Local/Temp/msohtmlclip1/01/clip_image002.jpg" alt="img2" />
      `;

      const replaced = replaceFileUrlsWithRtfImages(html, rtf);
      expect(replaced).toContain('src="data:image/png;base64,');
      expect(replaced).toContain('src="data:image/jpeg;base64,');
      expect(replaced).not.toContain("file:///");
    });

    it("leaves HTML unchanged if no RTF or no images", () => {
      const html = `<p>Test</p>`;
      expect(replaceFileUrlsWithRtfImages(html)).toBe(html);
    });
  });
});
