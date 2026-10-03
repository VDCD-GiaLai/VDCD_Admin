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

  try {
    await writeFile(ENV_PATH, updatedLines.join("\n"), "utf-8");
  } catch (fsErr) {
    console.warn(
      "[Settings API] Warning: Could not persist to .env.local file (serverless/read-only environment), updated process.env in runtime memory only:",
      fsErr,
    );
  }

  // Always update process.env so changes take effect immediately
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
 * POST /api/settings — test connection for a specific key (e.g. GEMINI_API_KEY)
 */
export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json();
    if (key === "GEMINI_API_KEY") {
      const apiKey = value || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: "Chưa nhập API Key để kiểm tra" },
          { status: 400 },
        );
      }

      // Quick test ping to Gemini API
      const testModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`;
      const res = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `HTTP ${res.status}`;
        return NextResponse.json({
          success: false,
          error: `Google API báo lỗi: ${errMsg}`,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Kết nối thành công! API Key hợp lệ và hoạt động tốt.",
      });
    }

    return NextResponse.json(
      { error: "Key không hỗ trợ kiểm tra kết nối" },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
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
