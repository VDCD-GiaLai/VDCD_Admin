"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@heroui/react";
import {
  AppButton,
  FormInput,
  Spinner,
  useToast,
} from "@/components/ui";

/* ── Types ── */

interface SettingItem {
  key: string;
  label: string;
  description: string;
  value: string;
  maskedValue: string;
  isSet: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"env" | "system">("env");
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** Tracks which keys are currently being edited (revealed) */
  const [editingKeys, setEditingKeys] = useState<Set<string>>(new Set());
  /** Local edit values */
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  /** Track which keys have been modified */
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  /** Testing connection state */
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string } | null>
  >({});

  /* ── Fetch settings ── */

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        if (cancelled) return;
        setSettings(data.settings);
        const vals: Record<string, string> = {};
        for (const s of data.settings) {
          vals[s.key] = s.value;
        }
        setEditValues(vals);
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Lỗi tải cấu hình",
            description: String(err),
            color: "danger",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Actions ── */

  const toggleEdit = (key: string) => {
    setEditingKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleChange = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      const original = settings.find((s) => s.key === key)?.value || "";
      if (value !== original) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleTestConnection = async (key: string) => {
    setTestingKey(key);
    setTestResults((prev) => ({ ...prev, [key]: null }));
    try {
      const val =
        editValues[key] !== undefined
          ? editValues[key]
          : settings.find((s) => s.key === key)?.value || "";

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: val }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResults((prev) => ({
          ...prev,
          [key]: {
            success: true,
            message: data.message || "Kết nối thành công! API Key hợp lệ.",
          },
        }));
        toast({
          title: "Kiểm tra kết nối thành công",
          description: "API Key hợp lệ và hoạt động tốt.",
          color: "success",
        });
      } else {
        setTestResults((prev) => ({
          ...prev,
          [key]: {
            success: false,
            message: data.error || "Không thể kết nối đến máy chủ AI.",
          },
        }));
        toast({
          title: "Kiểm tra kết nối thất bại",
          description: data.error || "API Key không hợp lệ.",
          color: "danger",
        });
      }
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [key]: {
          success: false,
          message: String(err),
        },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  const handleSave = async () => {
    if (dirtyKeys.size === 0) return;

    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      for (const key of dirtyKeys) {
        updates[key] = editValues[key] || "";
      }

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi cập nhật");
      }

      toast({
        title: "Cập nhật thành công",
        description: `Đã lưu ${dirtyKeys.size} cấu hình. Có hiệu lực ngay lập tức.`,
        color: "success",
      });

      setDirtyKeys(new Set());
      setEditingKeys(new Set());

      // Reload settings from server
      const reloadRes = await fetch("/api/settings");
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setSettings(reloadData.settings);
        const vals: Record<string, string> = {};
        for (const s of reloadData.settings) {
          vals[s.key] = s.value;
        }
        setEditValues(vals);
      }
    } catch (err) {
      toast({
        title: "Lỗi cập nhật",
        description: String(err),
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const vals: Record<string, string> = {};
    for (const s of settings) {
      vals[s.key] = s.value;
    }
    setEditValues(vals);
    setDirtyKeys(new Set());
    setEditingKeys(new Set());
  };

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text">Quản lý hệ thống</h1>
        <p className="mt-1 text-sm text-text-muted">
          Cấu hình các biến môi trường, API keys và thông số vận hành của hệ thống.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("env")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "env"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-text-muted hover:text-text"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
            />
          </svg>
          Cấu hình ENV & AI Key
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "system"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-text-muted hover:text-text"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.216.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          Thông tin hệ thống
        </button>
      </div>

      {activeTab === "env" ? (
        <>
          {/* API Keys Card */}
          <Card className="border border-border bg-surface shadow-xs">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-text">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                  />
                </svg>
                Biến môi trường AI & Dịch vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {settings.map((setting) => {
                const isEditing = editingKeys.has(setting.key);
                const testRes = testResults[setting.key];

                return (
                  <div key={setting.key} className="px-5 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-text">
                            {setting.label}
                          </h3>
                          {setting.isSet ? (
                            <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                              ✓ Đã cấu hình
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                              ✕ Chưa cấu hình
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-text-muted leading-relaxed">
                          {setting.description}
                        </p>

                        {/* Value display / edit input */}
                        <div className="mt-3">
                          {isEditing ? (
                            <div className="space-y-2">
                              <FormInput
                                type="text"
                                value={editValues[setting.key] || ""}
                                onChange={(e) =>
                                  handleChange(setting.key, e.target.value)
                                }
                                placeholder={`Dán ${setting.label} vào đây...`}
                                className="w-full font-mono text-xs"
                              />
                              <p className="text-[11px] text-text-muted">
                                * Lấy key tại{" "}
                                <a
                                  href="https://aistudio.google.com/app/apikey"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline font-medium"
                                >
                                  Google AI Studio (aistudio.google.com)
                                </a>
                              </p>
                            </div>
                          ) : (
                            <code className="inline-block rounded-md bg-surface-alt px-3 py-1.5 font-mono text-xs text-text-muted max-w-full truncate">
                              {setting.maskedValue || "(chưa có giá trị)"}
                            </code>
                          )}
                        </div>

                        {/* Connection Test Result Badge */}
                        {testRes && (
                          <div
                            className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-xs leading-relaxed ${
                              testRes.success
                                ? "border border-success/30 bg-success/10 text-success"
                                : "border border-danger/30 bg-danger/10 text-danger"
                            }`}
                          >
                            <span className="font-bold text-sm">
                              {testRes.success ? "✓" : "✕"}
                            </span>
                            <div className="flex-1 font-medium">
                              {testRes.message}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-start shrink-0">
                        <AppButton
                          type="button"
                          variant="outline"
                          isLoading={testingKey === setting.key}
                          onClick={() => handleTestConnection(setting.key)}
                          className="text-xs"
                        >
                          Kiểm tra kết nối
                        </AppButton>

                        <AppButton
                          type="button"
                          variant="ghost"
                          onClick={() => toggleEdit(setting.key)}
                          className="text-xs"
                        >
                          {isEditing ? "Ẩn" : "Sửa"}
                        </AppButton>
                      </div>
                    </div>

                    {/* Environment variable key hint */}
                    <div className="mt-3">
                      <span className="text-[10px] text-text-muted font-mono bg-surface-alt px-1.5 py-0.5 rounded">
                        ENV: {setting.key}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Save Bar */}
          {dirtyKeys.size > 0 && (
            <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-4 shadow-lg backdrop-blur-sm z-20">
              <p className="text-sm font-medium text-warning">
                {dirtyKeys.size} thay đổi chưa lưu
              </p>
              <div className="flex items-center gap-2">
                <AppButton
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  className="text-xs"
                >
                  Huỷ bỏ
                </AppButton>
                <AppButton
                  type="button"
                  isLoading={saving}
                  onClick={handleSave}
                  className="text-xs"
                >
                  Lưu thay đổi
                </AppButton>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-lg border border-border bg-surface-alt p-4">
            <h4 className="text-xs font-semibold text-text mb-2">ℹ️ Lưu ý quan trọng</h4>
            <ul className="space-y-1.5 text-xs text-text-muted list-disc list-inside">
              <li>
                Giá trị được lưu vào file <code className="bg-surface px-1 rounded">.env.local</code> và cập nhật trực tiếp vào bộ nhớ máy chủ (runtime).
              </li>
              <li>
                Tính năng <strong>Smart Import</strong> trong Trình soạn thảo bài viết, hoạt động và giải pháp sẽ lập tức sử dụng API Key mới.
              </li>
              <li>
                Nhấn nút <strong>Kiểm tra kết nối</strong> để xác minh ngay API key có hợp lệ với Google hay không trước khi lưu.
              </li>
            </ul>
          </div>
        </>
      ) : (
        /* System Info Tab */
        <Card className="border border-border bg-surface shadow-xs">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-text">
              Thông tin cấu hình hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            <div className="flex items-center justify-between px-5 py-3.5 text-xs">
              <span className="text-text-muted">Ứng dụng</span>
              <span className="font-semibold text-text">VDCD Admin Dashboard</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 text-xs">
              <span className="text-text-muted">Backend API</span>
              <span className="font-mono text-text">
                {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 text-xs">
              <span className="text-text-muted">AI Model mặc định</span>
              <span className="font-mono text-text">gemini-2.0-flash</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 text-xs">
              <span className="text-text-muted">Tính năng AI hỗ trợ</span>
              <span className="text-success font-medium">Smart Import (Word/Docs to Custom Blocks)</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
