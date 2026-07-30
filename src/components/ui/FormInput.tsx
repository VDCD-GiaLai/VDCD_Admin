"use client";

import {
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  forwardRef,
} from "react";

// ─── Types ───────────────────────────────────────────────────

type InputSize = "sm" | "md" | "lg";
type InputRadius = "none" | "md" | "full";
type InputBorder = "solid" | "dotted" | "dashed";

interface FormInputBaseProps {
  /** Label displayed above the input */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message — overrides helperText and shows red styling */
  errorMessage?: string;
  /** Input size variant */
  size?: InputSize;
  /** Border radius variant */
  radius?: InputRadius;
  /** Border style variant */
  borderStyle?: InputBorder;
  /** Whether the field is required (shows * after label) */
  isRequired?: boolean;
  /** Render content at the start of the input (icon, text, etc.) */
  startContent?: ReactNode;
  /** Render content at the end of the input (icon, text, etc.) */
  endContent?: ReactNode;
  /** Additional class for the outer wrapper */
  wrapperClassName?: string;
}

// ─── Size class mapping ──────────────────────────────────────

const sizeClasses: Record<InputSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2.5 text-base",
};

const labelSizeClasses: Record<InputSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};

// ─── Radius class mapping ────────────────────────────────────

const radiusClasses: Record<InputRadius, string> = {
  none: "rounded-none",
  md: "rounded-md",
  full: "rounded-full",
};

// ─── Border style mapping ────────────────────────────────────

const borderStyleClasses: Record<InputBorder, string> = {
  solid: "border-solid",
  dotted: "border-dotted",
  dashed: "border-dashed",
};

// ─── Helper: build input className ───────────────────────────

function buildInputClass(
  size: InputSize,
  radius: InputRadius,
  borderStyle: InputBorder,
  isInvalid: boolean,
  hasStartContent: boolean,
  hasEndContent: boolean,
  extraClass?: string,
): string {
  const base = [
    "w-full border bg-[var(--field-background,#fff)] text-[var(--field-foreground,#011A42)]",
    "placeholder:text-[var(--field-placeholder,#6C7E96)]",
    "transition-colors duration-150",
    "focus:border-[var(--focus,#ca2a30)] focus:outline-none focus:ring-1 focus:ring-[var(--focus,#ca2a30)]",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[var(--surface-secondary,#F9F7FC)]",
    "read-only:bg-[var(--surface-secondary,#F9F7FC)] read-only:focus:ring-0 read-only:focus:border-[var(--field-border,#E2E8EE)]",
  ];

  base.push(sizeClasses[size]);
  base.push(radiusClasses[radius]);
  base.push(borderStyleClasses[borderStyle]);

  if (isInvalid) {
    base.push("border-[var(--danger,#FF6757)] focus:border-[var(--danger,#FF6757)] focus:ring-[var(--danger,#FF6757)]");
  } else {
    base.push("border-[var(--field-border,#E2E8EE)]");
  }

  if (hasStartContent) base.push("pl-9");
  if (hasEndContent) base.push("pr-9");

  if (extraClass) base.push(extraClass);

  return base.join(" ");
}

// ═════════════════════════════════════════════════════════════
//  FormInput — standard text input (text, email, password, number, tel, url, search, date, etc.)
// ═════════════════════════════════════════════════════════════

export interface FormInputProps
  extends FormInputBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    {
      label,
      helperText,
      errorMessage,
      size = "md",
      radius = "md",
      borderStyle = "solid",
      isRequired,
      startContent,
      endContent,
      wrapperClassName,
      className,
      id,
      ...inputProps
    },
    ref,
  ) {
    const isInvalid = !!errorMessage;
    const inputId = id ?? (label ? `field-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div
        className={`flex flex-col gap-1.5 ${wrapperClassName ?? ""}`}
      >
        {label && (
          <label
            htmlFor={inputId}
            className={`font-medium text-[var(--foreground,#011A42)] ${labelSizeClasses[size]}`}
          >
            {label}
            {isRequired && (
              <span className="ml-0.5 text-[var(--danger,#FF6757)]">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {startContent && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted,#6C7E96)]">
              {startContent}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={buildInputClass(
              size,
              radius,
              borderStyle,
              isInvalid,
              !!startContent,
              !!endContent,
              className,
            )}
            {...inputProps}
          />

          {endContent && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted,#6C7E96)]">
              {endContent}
            </span>
          )}
        </div>

        {isInvalid ? (
          <p className="text-xs text-[var(--danger,#FF6757)]">{errorMessage}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--muted,#6C7E96)]">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

// ═════════════════════════════════════════════════════════════
//  FormTextarea — multi-line text input
// ═════════════════════════════════════════════════════════════

export interface FormTextareaProps
  extends FormInputBaseProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    {
      label,
      helperText,
      errorMessage,
      size = "md",
      radius = "md",
      borderStyle = "solid",
      isRequired,
      wrapperClassName,
      className,
      rows = 4,
      id,
      // startContent / endContent not used for textarea
      ...textareaProps
    },
    ref,
  ) {
    const isInvalid = !!errorMessage;
    const textareaId = id ?? (label ? `field-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    const textareaClass = [
      "w-full border bg-[var(--field-background,#fff)] text-[var(--field-foreground,#011A42)]",
      "placeholder:text-[var(--field-placeholder,#6C7E96)]",
      "transition-colors duration-150 resize-y",
      "focus:border-[var(--focus,#ca2a30)] focus:outline-none focus:ring-1 focus:ring-[var(--focus,#ca2a30)]",
      "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[var(--surface-secondary,#F9F7FC)]",
      "read-only:bg-[var(--surface-secondary,#F9F7FC)] read-only:focus:ring-0 read-only:focus:border-[var(--field-border,#E2E8EE)]",
      sizeClasses[size],
      radiusClasses[radius],
      borderStyleClasses[borderStyle],
      isInvalid
        ? "border-[var(--danger,#FF6757)] focus:border-[var(--danger,#FF6757)] focus:ring-[var(--danger,#FF6757)]"
        : "border-[var(--field-border,#E2E8EE)]",
      className ?? "",
    ].join(" ");

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName ?? ""}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className={`font-medium text-[var(--foreground,#011A42)] ${labelSizeClasses[size]}`}
          >
            {label}
            {isRequired && (
              <span className="ml-0.5 text-[var(--danger,#FF6757)]">*</span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={textareaClass}
          {...textareaProps}
        />

        {isInvalid ? (
          <p className="text-xs text-[var(--danger,#FF6757)]">{errorMessage}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--muted,#6C7E96)]">{helperText}</p>
        ) : null}
      </div>
    );
  },
);


// ═════════════════════════════════════════════════════════════
//  FormFileInput — file upload input
// ═════════════════════════════════════════════════════════════

export interface FormFileInputProps
  extends FormInputBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {}

export const FormFileInput = forwardRef<HTMLInputElement, FormFileInputProps>(
  function FormFileInput(
    {
      label,
      helperText,
      errorMessage,
      size = "md",
      radius = "md",
      borderStyle = "solid",
      isRequired,
      wrapperClassName,
      className,
      id,
      ...inputProps
    },
    ref,
  ) {
    const isInvalid = !!errorMessage;
    const inputId = id ?? (label ? `field-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    const fileClass = [
      "w-full border bg-[var(--field-background,#fff)] text-[var(--field-foreground,#011A42)]",
      "transition-colors duration-150",
      "file:mr-3 file:border-0 file:bg-[var(--surface-secondary,#F9F7FC)] file:text-[var(--foreground,#011A42)]",
      "file:font-medium file:cursor-pointer",
      "focus:border-[var(--focus,#ca2a30)] focus:outline-none focus:ring-1 focus:ring-[var(--focus,#ca2a30)]",
      "disabled:cursor-not-allowed disabled:opacity-60",
      sizeClasses[size],
      `file:${sizeClasses[size]}`,
      radiusClasses[radius],
      borderStyleClasses[borderStyle],
      isInvalid
        ? "border-[var(--danger,#FF6757)]"
        : "border-[var(--field-border,#E2E8EE)]",
      className ?? "",
    ].join(" ");

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName ?? ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`font-medium text-[var(--foreground,#011A42)] ${labelSizeClasses[size]}`}
          >
            {label}
            {isRequired && (
              <span className="ml-0.5 text-[var(--danger,#FF6757)]">*</span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type="file"
          className={fileClass}
          {...inputProps}
        />

        {isInvalid ? (
          <p className="text-xs text-[var(--danger,#FF6757)]">{errorMessage}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--muted,#6C7E96)]">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

// ═════════════════════════════════════════════════════════════
//  FormColorInput — color picker input
// ═════════════════════════════════════════════════════════════

export interface FormColorInputProps
  extends FormInputBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {}

export const FormColorInput = forwardRef<HTMLInputElement, FormColorInputProps>(
  function FormColorInput(
    {
      label,
      helperText,
      errorMessage,
      size = "md",
      radius = "md",
      isRequired,
      wrapperClassName,
      className,
      id,
      ...inputProps
    },
    ref,
  ) {
    const isInvalid = !!errorMessage;
    const inputId = id ?? (label ? `field-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    const colorClass = [
      "h-10 w-16 cursor-pointer border p-1",
      radiusClasses[radius],
      isInvalid
        ? "border-[var(--danger,#FF6757)]"
        : "border-[var(--field-border,#E2E8EE)]",
      className ?? "",
    ].join(" ");

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName ?? ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`font-medium text-[var(--foreground,#011A42)] ${labelSizeClasses[size]}`}
          >
            {label}
            {isRequired && (
              <span className="ml-0.5 text-[var(--danger,#FF6757)]">*</span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type="color"
          className={colorClass}
          {...inputProps}
        />

        {isInvalid ? (
          <p className="text-xs text-[var(--danger,#FF6757)]">{errorMessage}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--muted,#6C7E96)]">{helperText}</p>
        ) : null}
      </div>
    );
  },
);
