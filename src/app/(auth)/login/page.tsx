"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/features/auth/api";
import { loginSchema, type LoginFormData } from "@/features/auth/schema";

/**
 * Login page — UC-AUTH-01
 *
 * VShop-style sign-in: logo + heading + subtitle inside a white card,
 * email + password (with visibility toggle), and submit button.
 *
 * Stripped of social login, remember me, forgot password, and sign up links
 * per design requirements.
 */
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin();

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Map API error to Vietnamese message
  const getErrorMessage = (): string | null => {
    if (!loginMutation.error) return null;

    const status = loginMutation.error.status;
    if (status === 401) return "Email hoặc mật khẩu không chính xác";
    if (status === 403) return "Tài khoản đã bị khoá, liên hệ quản trị viên";
    if (status === 429) return "Đăng nhập quá nhiều lần, vui lòng thử lại sau";

    return loginMutation.error.message || "Lỗi hệ thống, vui lòng thử lại";
  };

  const apiError = getErrorMessage();

  return (
    <>
      {/* ── Brand Logo (inside card, like VShop) ── */}
      <div className="mb-6">
        <VdcdLogo />
      </div>

      {/* ── Title & Subtitle ── */}
      <h4 className="mb-1 text-2xl font-semibold text-text">
        Xin chào!
      </h4>
      <p className="mb-6 text-text-muted">
        Vui lòng nhập thông tin đăng nhập
      </p>

      {/* ── Form ── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {/* API error banner */}
        {apiError && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {apiError}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-semibold text-text"
          >
            Email
          </label>
          <input
            {...register("email")}
            id="login-email"
            type="email"
            placeholder="admin@vdcd.vn"
            autoComplete="email"
            autoFocus
            className={`h-[38px] w-full rounded-[5px] border bg-surface px-3.5 text-sm text-text placeholder:text-text-muted outline-none transition-all duration-200 focus:border-primary focus:ring-[3px] focus:ring-primary/25 ${errors.email
                ? "border-danger focus:border-danger focus:ring-danger/25"
                : "border-border"
              }`}
          />
          {errors.email && (
            <span className="mt-1 block text-xs text-danger">{errors.email.message}</span>
          )}
        </div>

        {/* Password */}
        <div className="mb-2">
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-sm font-semibold text-text"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <input
              {...register("password")}
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              className={`h-[38px] w-full rounded-[5px] border bg-surface pr-11 pl-3.5 text-sm text-text placeholder:text-text-muted outline-none transition-all duration-200 focus:border-primary focus:ring-[3px] focus:ring-primary/25 ${errors.password
                  ? "border-danger focus:border-danger focus:ring-danger/25"
                  : "border-border"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 flex h-[38px] w-11 items-center justify-center text-text-muted transition-colors hover:text-text focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOffIcon className="h-[18px] w-[18px]" />
              ) : (
                <EyeIcon className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
          {errors.password && (
            <span className="mt-1 block text-xs text-danger">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-6 flex h-[38px] w-full items-center justify-center rounded-[5px] bg-primary text-sm font-semibold text-primary-fg shadow-sm transition-all duration-200 hover:bg-[#834ce3] focus:outline-none focus:ring-[3px] focus:ring-primary/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {loginMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-[spin_0.75s_linear_infinite] rounded-full border-2 border-white border-r-transparent" />
              Đang đăng nhập...
            </span>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
//  Inline SVG Components
// ═════════════════════════════════════════════════════════════

/** VDCD brand logo — stylized arrow mark matching Vyzor aesthetic */
function VdcdLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight text-text">
        VDCD <span className="font-normal text-text-muted">Admin</span>
      </span>
    </div>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
