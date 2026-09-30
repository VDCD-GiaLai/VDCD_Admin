/**
 * RTF Image Extractor
 * Extracts embedded images (PNG, JPEG, WMF) from Microsoft Word RTF clipboard data
 * and replaces unreadable `file:///` URLs in pasted Word HTML with Base64 data URLs.
 */

export interface ExtractedImage {
  mimeType: string;
  dataUrl: string;
  hexLength: number;
}

/**
 * Converts a hexadecimal string to a Base64 string in browser / Node.js
 */
export function hexToBase64(hex: string): string {
  // Clean whitespace and linebreaks
  const cleanHex = hex.replace(/[\s\r\n]+/g, "");
  const len = cleanHex.length;
  
  if (len === 0 || len % 2 !== 0) {
    return "";
  }

  // Use Uint8Array to hold decoded bytes
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }

  // Convert bytes to binary string
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  if (typeof btoa !== "undefined") {
    return btoa(binary);
  } else if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  return "";
}

/**
 * Detect image MIME type from the first few bytes of hex data
 */
export function detectMimeFromHex(hex: string): string {
  const prefix = hex.substring(0, 16).toLowerCase();
  if (prefix.startsWith("89504e47")) return "image/png";
  if (prefix.startsWith("ffd8ff")) return "image/jpeg";
  if (prefix.startsWith("47494638")) return "image/gif";
  if (prefix.startsWith("52494646")) return "image/webp";
  if (prefix.startsWith("424d")) return "image/bmp";
  return "image/png"; // Default fallback
}

/**
 * Extracts all embedded images from an RTF string copied from Microsoft Word
 */
export function extractImagesFromRtf(rtf: string): ExtractedImage[] {
  if (!rtf || typeof rtf !== "string") {
    return [];
  }

  const results: ExtractedImage[] = [];

  // Match each \pict group in RTF (handles nested groups like {\*\picprop...})
  const pictRegex = /\\pict(?:[^{}]|\{[^{}]*\})*?\}/gi;
  let match: RegExpExecArray | null;

  while ((match = pictRegex.exec(rtf)) !== null) {
    const pictBlock = match[0];

    // Determine MIME type from blip tags
    let mimeType = "image/png";
    if (/\\jpegblip/i.test(pictBlock)) {
      mimeType = "image/jpeg";
    } else if (/\\pngblip/i.test(pictBlock)) {
      mimeType = "image/png";
    }

    // Strip out all RTF control words: \word123 or \*word
    const withoutControls = pictBlock.replace(/\\\*?[a-zA-Z]+[-0-9]*/g, " ");

    // Strip braces, whitespace, newlines, semicolons
    const rawHex = withoutControls.replace(/[{}\s\r\n;]+/g, "");

    // Must be substantial hex stream
    if (rawHex.length < 80) {
      continue;
    }

    // Clean any trailing non-hex characters if any
    const cleanHex = rawHex.replace(/[^0-9a-fA-F]/g, "");
    if (cleanHex.length < 80 || cleanHex.length % 2 !== 0) {
      continue;
    }

    const detectedMime = detectMimeFromHex(cleanHex);
    if (detectedMime) {
      mimeType = detectedMime;
    }

    const base64 = hexToBase64(cleanHex);
    if (base64) {
      results.push({
        mimeType,
        dataUrl: `data:${mimeType};base64,${base64}`,
        hexLength: cleanHex.length,
      });
    }
  }

  return results;
}

/**
 * Replaces unreadable Word image URLs (e.g. `file:///.../clip_image001.png` or `msohtmlclip`)
 * in pasted Word HTML with Base64 data URLs extracted from the RTF clipboard stream.
 */
export function replaceFileUrlsWithRtfImages(html: string, rtf?: string): string {
  if (!html) return "";
  if (!rtf) return html;

  const extractedImages = extractImagesFromRtf(rtf);
  if (extractedImages.length === 0) {
    return html;
  }

  let imageIndex = 0;

  // 1. Replace <img> tags with file:// or mso temp src
  let replacedHtml = html.replace(
    /(<img\b[^>]*?\bsrc=["'])(file:\/\/\/[^"']+|msohtmlclip[^"']*|blob:[^"']*)(["'][^>]*>)/gi,
    (fullMatch, prefix, oldSrc, suffix) => {
      if (imageIndex < extractedImages.length) {
        const dataUrl = extractedImages[imageIndex].dataUrl;
        imageIndex++;
        return `${prefix}${dataUrl}${suffix}`;
      }
      return fullMatch;
    },
  );

  // 2. Also replace Word VML imagedata tags: <v:imagedata src="file:///..." ...>
  replacedHtml = replacedHtml.replace(
    /(<v:imagedata\b[^>]*?\bsrc=["'])(file:\/\/\/[^"']+|msohtmlclip[^"']*)(["'][^>]*>)/gi,
    (fullMatch, prefix, oldSrc, suffix) => {
      if (imageIndex < extractedImages.length) {
        const dataUrl = extractedImages[imageIndex].dataUrl;
        imageIndex++;
        return `${prefix}${dataUrl}${suffix}`;
      }
      return fullMatch;
    },
  );

  return replacedHtml;
}
