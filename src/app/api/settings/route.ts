import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";

/**
 * Editable environment variables.
 * Only these keys can be read/written through the settings API.
 * This acts as an allowlist to prevent arbitrary env manipulation.
 */
const EDITABLE_KEYS = ["GEMINI_API_KEY"] as const;
type EditableKey = (typeof EDITABLE_KEYS)[number];

/** Human-readable labels for UI display */
const KEY_LABELS: Record<EditableKey, string> = {
  GEMINI_API_KEY: "Gemini AI API Key",
};

const KEY_DESCRIPTIONS: Record<EditableKey, string> = {
  GEMINI_API_KEY: "API key cho tính năng Smart Import (chuyển đổi nội dung bằng AI). Lấy từ Google AI Studio.",
};

const ENV_PATH = resolve(process.cwd(), ".env.local");

/**
 * Parse .env.local into a key-value map.
 */
async function parseEnvFile(): Promise<Record<string, string>> {
  try {
    const content = await readFile(ENV_PATH, "utf-8");
    const result: Record<string, string> = {};
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Remove surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Write key-value map back to .env.local, preserving comments and order.
 */
async function updateEnvFile(updates: Record<string, string>): Promise<void> {
  let content: string;
  try {
    content = await readFile(ENV_PATH, "utf-8");
  } catch {
    content = "";
  }

  const lines = content.split(/\r?\n/);
  const updatedKeys = new Set<string>();

  // Update existing lines
  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) return line;
    const key = trimmed.slice(0, eqIdx).trim();
    if (key in updates) {
      updatedKeys.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  // Append new keys that weren't in the file
  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      updatedLines.push(`${key}=${value}`);
    }
  }

  await writeFile(ENV_PATH, updatedLines.join("\n"), "utf-8");

  // Also update process.env so changes take effect immediately
  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value;
  }
}

/**
 * GET /api/settings — returns editable settings with masked values
 */
export async function GET() {
  const env = await parseEnvFile();

  const settings = EDITABLE_KEYS.map((key) => {
    const value = env[key] || process.env[key] || "";
    return {
      key,
      label: KEY_LABELS[key],
      description: KEY_DESCRIPTIONS[key],
      value,
      maskedValue: maskValue(value),
      isSet: !!value,
    };
  });

  return NextResponse.json({ settings });
}

/**
 * PATCH /api/settings — update one or more settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updates: Record<string, string> = {};

    for (const [key, value] of Object.entries(body)) {
      if (!EDITABLE_KEYS.includes(key as EditableKey)) {
        return NextResponse.json(
          { error: `Key "${key}" không được phép chỉnh sửa` },
          { status: 400 },
        );
      }
      if (typeof value !== "string") {
        return NextResponse.json(
          { error: `Giá trị cho "${key}" phải là string` },
          { status: 400 },
        );
      }
      updates[key] = value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Không có thay đổi nào" },
        { status: 400 },
      );
    }

    await updateEnvFile(updates);

    return NextResponse.json({
      message: "Cập nhật thành công",
      updated: Object.keys(updates),
    });
  } catch (err) {
    console.error("[Settings API Error]", err);
    return NextResponse.json(
      { error: "Lỗi cập nhật cấu hình" },
      { status: 500 },
    );
  }
}

/**
 * Mask a sensitive value for display.
 * Shows first 8 chars + last 4 chars, rest is masked.
 */
function maskValue(value: string): string {
  if (!value) return "";
  if (value.length <= 12) return "•".repeat(value.length);
  return value.slice(0, 8) + "•".repeat(Math.min(value.length - 12, 20)) + value.slice(-4);
}
