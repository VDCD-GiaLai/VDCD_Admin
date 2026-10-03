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
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** Tracks which keys are currently being edited (revealed) */
  const [editingKeys, setEditingKeys] = useState<Set<string>>(new Set());
  /** Local edit values */
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  /** Track which keys have been modified */
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

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
    return () => { cancelled = true; };
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
        description: `Đã lưu ${dirtyKeys.size} cấu hình`,
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
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-text">Cấu hình hệ thống</h1>
        <p className="mt-1 text-sm text-text-muted">
          Quản lý các biến môi trường và cấu hình hệ thống.
          Thay đổi sẽ có hiệu lực ngay lập tức.
        </p>
      </div>

      {/* API Keys Section */}
      <Card className="border border-border bg-surface shadow-xs">
        <CardHeader className="border-b border-border px-5 py-3.5">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-text">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {settings.map((setting) => {
            const isEditing = editingKeys.has(setting.key);

            return (
              <div key={setting.key} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
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
                    <p className="mt-0.5 text-xs text-text-muted">
                      {setting.description}
                    </p>

                    {/* Value display / edit */}
                    <div className="mt-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <FormInput
                            type="text"
                            value={editValues[setting.key] || ""}
                            onChange={(e) =>
                              handleChange(setting.key, e.target.value)
                            }
                            placeholder={`Nhập ${setting.label}...`}
                            className="flex-1 font-mono text-xs"
                          />
                        </div>
                      ) : (
                        <code className="inline-block rounded-md bg-surface-alt px-3 py-1.5 font-mono text-xs text-text-muted">
                          {setting.maskedValue || "(trống)"}
                        </code>
                      )}
                    </div>
                  </div>

                  <AppButton
                    type="button"
                    variant="ghost"
                    onClick={() => toggleEdit(setting.key)}
                    className="mt-1 text-xs shrink-0"
                  >
                    {isEditing ? (
                      <>
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                        Ẩn
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        Sửa
                      </>
                    )}
                  </AppButton>
                </div>

                {/* Environment variable key hint */}
                <div className="mt-2">
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
        <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-4 shadow-lg backdrop-blur-sm">
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
        <h4 className="text-xs font-semibold text-text mb-2">ℹ️ Lưu ý</h4>
        <ul className="space-y-1 text-xs text-text-muted list-disc list-inside">
          <li>Các giá trị được lưu vào file <code className="bg-surface px-1 rounded">.env.local</code> và có hiệu lực ngay lập tức.</li>
          <li>Khi deploy, cần cấu hình các biến này trên hosting platform (Vercel, Railway, etc.).</li>
          <li>API Key sẽ được mã hoá hiển thị. Nhấn <strong>Sửa</strong> để xem hoặc thay đổi giá trị.</li>
        </ul>
      </div>
    </div>
  );
}
