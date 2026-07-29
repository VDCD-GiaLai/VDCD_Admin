"use client";

import {
  type InputHTMLAttributes,
  forwardRef,
} from "react";

// ─── Shared Types ────────────────────────────────────────────

type CheckSize = "sm" | "md" | "lg";
type CheckColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "dark";

// ─── Color mapping (using CSS variables from DESIGN.md) ──────

const colorMap: Record<CheckColor, { bg: string; border: string; ring: string }> = {
  primary: {
    bg: "var(--accent, #985FFD)",
    border: "var(--accent, #985FFD)",
    ring: "var(--accent, #985FFD)",
  },
  secondary: {
    bg: "var(--color-secondary, #FF49CD)",
    border: "var(--color-secondary, #FF49CD)",
    ring: "var(--color-secondary, #FF49CD)",
  },
  success: {
    bg: "var(--success, #32D484)",
    border: "var(--success, #32D484)",
    ring: "var(--success, #32D484)",
  },
  warning: {
    bg: "var(--warning, #FDAF22)",
    border: "var(--warning, #FDAF22)",
    ring: "var(--warning, #FDAF22)",
  },
  danger: {
    bg: "var(--danger, #FF6757)",
    border: "var(--danger, #FF6757)",
    ring: "var(--danger, #FF6757)",
  },
  info: {
    bg: "var(--color-info, #00C9FF)",
    border: "var(--color-info, #00C9FF)",
    ring: "var(--color-info, #00C9FF)",
  },
  dark: {
    bg: "var(--color-dark, #0A0A0A)",
    border: "var(--color-dark, #0A0A0A)",
    ring: "var(--color-dark, #0A0A0A)",
  },
};

// ─── Size mapping ────────────────────────────────────────────

const checkboxSizeClasses: Record<CheckSize, { input: string; label: string }> = {
  sm: { input: "h-3.5 w-3.5", label: "text-xs" },
  md: { input: "h-4 w-4", label: "text-sm" },
  lg: { input: "h-5 w-5", label: "text-base" },
};

const switchSizeClasses: Record<CheckSize, { track: string; thumb: string; translate: string }> = {
  sm: { track: "h-4 w-7", thumb: "h-3 w-3", translate: "translate-x-3" },
  md: { track: "h-5 w-9", thumb: "h-4 w-4", translate: "translate-x-4" },
  lg: { track: "h-6 w-11", thumb: "h-5 w-5", translate: "translate-x-5" },
};


// ═════════════════════════════════════════════════════════════
//  FormCheckbox — single checkbox
// ═════════════════════════════════════════════════════════════

export interface FormCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Checkbox label */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Error message */
  errorMessage?: string;
  /** Color variant */
  color?: CheckColor;
  /** Size variant */
  size?: CheckSize;
  /** Whether the checkbox uses outline style (border only when unchecked) */
  isOutlined?: boolean;
  /** Reverse layout (label on left, checkbox on right) */
  isReversed?: boolean;
  /** Additional class for the wrapper */
  wrapperClassName?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  function FormCheckbox(
    {
      label,
      description,
      errorMessage,
      color = "primary",
      size = "md",
      isOutlined = false,
      isReversed = false,
      wrapperClassName,
      className,
      id,
      disabled,
      ...inputProps
    },
    ref,
  ) {
    const isInvalid = !!errorMessage;
    const inputId = id ?? (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const sizeClass = checkboxSizeClasses[size];
    const colors = colorMap[color];

    return (
      <div className={`flex flex-col gap-1 ${wrapperClassName ?? ""}`}>
        <label
          htmlFor={inputId}
          className={[
            "inline-flex cursor-pointer items-center gap-2.5",
            sizeClass.label,
            "text-[var(--foreground,#011A42)]",
            isReversed ? "flex-row-reverse justify-between" : "",
            disabled ? "cursor-not-allowed opacity-60" : "",
          ].join(" ")}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            className={[
              sizeClass.input,
              "shrink-0 cursor-pointer appearance-none rounded border-2 transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "checked:border-transparent checked:bg-current",
              // Checkmark via background image
              "checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22white%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22%2F%3E%3C%2Fsvg%3E')]",
              "checked:bg-center checked:bg-no-repeat",
              className ?? "",
            ].join(" ")}
            style={{
              borderColor: isInvalid ? "var(--danger, #FF6757)" : isOutlined ? colors.border : "var(--field-border, #E2E8EE)",
              color: colors.bg,
              ["--tw-ring-color" as string]: isInvalid ? "var(--danger, #FF6757)" : colors.ring,
            } as React.CSSProperties}
            {...inputProps}
          />
          {label && <span>{label}</span>}
        </label>

        {description && !isInvalid && (
          <p className={`text-xs text-[var(--muted,#6C7E96)] ${isReversed ? "" : "ml-[calc(theme(spacing.4)+10px)]"}`}>
            {description}
          </p>
        )}

        {isInvalid && (
          <p className={`text-xs text-[var(--danger,#FF6757)] ${isReversed ? "" : "ml-[calc(theme(spacing.4)+10px)]"}`}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

// ═════════════════════════════════════════════════════════════
//  FormCheckboxGroup — group of checkboxes
// ═════════════════════════════════════════════════════════════

export interface CheckboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface FormCheckboxGroupProps {
  /** Group label */
  label?: string;
  /** Checkbox options */
  options: CheckboxOption[];
  /** Currently selected values */
  value?: string[];
  /** Name attribute for the group */
  name: string;
  /** Change handler */
  onChange?: (values: string[]) => void;
  /** Error message */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
  /** Color variant */
  color?: CheckColor;
  /** Size variant */
  size?: CheckSize;
  /** Outline style */
  isOutlined?: boolean;
  /** Required field */
  isRequired?: boolean;
  /** Disabled state for the whole group */
  disabled?: boolean;
  /** Additional class for the wrapper */
  wrapperClassName?: string;
}

export function FormCheckboxGroup({
  label,
  options,
  value = [],
  name,
  onChange,
  errorMessage,
  helperText,
  direction = "vertical",
  color = "primary",
  size = "md",
  isOutlined = false,
  isRequired,
  disabled,
  wrapperClassName,
}: FormCheckboxGroupProps) {
  const isInvalid = !!errorMessage;

  const handleChange = (optionValue: string, checked: boolean) => {
    if (!onChange) return;
    const next = checked
      ? [...value, optionValue]
      : value.filter((v) => v !== optionValue);
    onChange(next);
  };

  return (
    <fieldset
      className={`flex flex-col gap-2 ${wrapperClassName ?? ""}`}
      disabled={disabled}
    >
      {label && (
        <legend className="mb-1 text-sm font-medium text-[var(--foreground,#011A42)]">
          {label}
          {isRequired && (
            <span className="ml-0.5 text-[var(--danger,#FF6757)]">*</span>
          )}
        </legend>
      )}

      <div
        className={`flex ${direction === "vertical" ? "flex-col gap-2" : "flex-row flex-wrap gap-x-5 gap-y-2"}`}
      >
        {options.map((opt) => (
          <FormCheckbox
            key={opt.value}
            name={name}
            value={opt.value}
            label={opt.label}
            description={opt.description}
            checked={value.includes(opt.value)}
            onChange={(e) => handleChange(opt.value, e.target.checked)}
            disabled={opt.disabled}
            color={color}
            size={size}
            isOutlined={isOutlined}
          />
        ))}
      </div>

      {isInvalid ? (
        <p className="text-xs text-[var(--danger,#FF6757)]">{errorMessage}</p>
      ) : helperText ? (
        <p className="text-xs text-[var(--muted,#6C7E96)]">{helperText}</p>
      ) : null}
    </fieldset>
  );
}

// ═════════════════════════════════════════════════════════════
//  FormRadio — single radio button
// ═════════════════════════════════════════════════════════════

export interface FormRadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Radio label */
  label?: string;
  /** Description text */
  description?: string;
  /** Color variant */
  color?: CheckColor;
  /** Size variant */
  size?: CheckSize;
  /** Outline style */
  isOutlined?: boolean;
  /** Reverse layout */
  isReversed?: boolean;
  /** Additional class for the wrapper */
  wrapperClassName?: string;
}

export const FormRadio = forwardRef<HTMLInputElement, FormRadioProps>(
  function FormRadio(
    {
      label,
      description,
      color = "primary",
      size = "md",
      isOutlined = false,
      isReversed = false,
      wrapperClassName,
      className,
      id,
      disabled,
      ...inputProps
    },
    ref,
  ) {
    const sizeClass = checkboxSizeClasses[size];
    const colors = colorMap[color];

    return (
      <div className={`flex flex-col gap-1 ${wrapperClassName ?? ""}`}>
        <label
          htmlFor={id}
          className={[
            "inline-flex cursor-pointer items-center gap-2.5",
            sizeClass.label,
            "text-[var(--foreground,#011A42)]",
            isReversed ? "flex-row-reverse justify-between" : "",
            disabled ? "cursor-not-allowed opacity-60" : "",
          ].join(" ")}
        >
          <input
            ref={ref}
            id={id}
            type="radio"
            disabled={disabled}
            className={[
              sizeClass.input,
              "shrink-0 cursor-pointer appearance-none rounded-full border-2 transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-60",
              // Inner dot via box-shadow on checked
              "checked:border-current checked:bg-current",
              "checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%228%22%20cy%3D%228%22%20r%3D%223%22%20fill%3D%22white%22%2F%3E%3C%2Fsvg%3E')]",
              "checked:bg-center checked:bg-no-repeat",
              className ?? "",
            ].join(" ")}
            style={{
              borderColor: isOutlined ? colors.border : "var(--field-border, #E2E8EE)",
              color: colors.bg,
              ["--tw-ring-color" as string]: colors.ring,
            } as React.CSSProperties}
            {...inputProps}
          />
          {label && <span>{label}</span>}
        </label>

        {description && (
          <p className={`text-xs text-[var(--muted,#6C7E96)] ${isReversed ? "" : "ml-[calc(theme(spacing.4)+10px)]"}`}>
            {description}
          </p>
        )}
      </div>
    );
  },
);

// ═════════════════════════════════════════════════════════════
//  FormRadioGroup — group of radio buttons
// ═════════════════════════════════════════════════════════════

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface FormRadioGroupProps {
  /** Group label */
  label?: string;
  /** Radio options */
  options: RadioOption[];
  /** Currently selected value */
  value?: string;
  /** Name attribute for the group */
  name: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Error message */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
  /** Color variant */
  color?: CheckColor;
  /** Size variant */
  size?: CheckSize;
  /** Outline style */
  isOutlined?: boolean;
  /** Required field */
  isRequired?: boolean;
  /** Disabled state for the whole group */
  disabled?: boolean;
  /** Additional class for the wrapper */
  wrapperClassName?: string;
}

export function FormRadioGroup({
  label,
  options,
  value,
  name,
  onChange,
  errorMessage,
  helperText,
  direction = "vertical",
  color = "primary",
  size = "md",
  isOutlined = false,
  isRequired,
  disabled,
  wrapperClassName,
}: FormRadioGroupProps) {
  const isInvalid = !!errorMessage;

  return (
    <fieldset
      className={`flex flex-col gap-2 ${wrapperClassName ?? ""}`}
      disabled={disabled}
    >
      {label && (
        <legend className="mb-1 text-sm font-medium text-[var(--foreground,#011A42)]">
          {label}
          {isRequired && (
            <span className="ml-0.5 text-[var(--danger,#FF6757)]">*</span>
          )}
        </legend>
      )}

      <div
        className={`flex ${direction === "vertical" ? "flex-col gap-2" : "flex-row flex-wrap gap-x-5 gap-y-2"}`}
      >
        {options.map((opt) => (
          <FormRadio
            key={opt.value}
            name={name}
            value={opt.value}
            label={opt.label}
            description={opt.description}
            checked={value === opt.value}
            onChange={onChange}
            disabled={opt.disabled}
            color={color}
            size={size}
            isOutlined={isOutlined}
          />
        ))}
      </div>

      {isInvalid ? (
        <p className="text-xs text-[var(--danger,#FF6757)]">{errorMessage}</p>
      ) : helperText ? (
        <p className="text-xs text-[var(--muted,#6C7E96)]">{helperText}</p>
      ) : null}
    </fieldset>
  );
}

// ═════════════════════════════════════════════════════════════
//  FormSwitch — toggle switch (Vyzor style)
// ═════════════════════════════════════════════════════════════

export interface FormSwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Switch label */
  label?: string;
  /** Description text */
  description?: string;
  /** Error message */
  errorMessage?: string;
  /** Color variant */
  color?: CheckColor;
  /** Size variant */
  size?: CheckSize;
  /** Switch style variant */
  variant?: "rounded" | "square";
  /** Reverse layout (label on left, switch on right) */
  isReversed?: boolean;
  /** Additional class for the wrapper */
  wrapperClassName?: string;
}

export const FormSwitch = forwardRef<HTMLInputElement, FormSwitchProps>(
  function FormSwitch(
    {
      label,
      description,
      errorMessage,
      color = "primary",
      size = "md",
      variant = "rounded",
      isReversed = false,
      wrapperClassName,
      className,
      id,
      disabled,
      ...inputProps
    },
    ref,
  ) {
    const isInvalid = !!errorMessage;
    const inputId = id ?? (label ? `switch-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const switchSize = switchSizeClasses[size];
    const colors = colorMap[color];
    const borderRadius = variant === "rounded" ? "rounded-full" : "rounded-sm";
    const thumbRadius = variant === "rounded" ? "rounded-full" : "rounded-[1px]";

    return (
      <div className={`flex flex-col gap-1 ${wrapperClassName ?? ""}`}>
        <label
          htmlFor={inputId}
          className={[
            "inline-flex cursor-pointer items-center gap-2.5",
            "text-sm text-[var(--foreground,#011A42)]",
            isReversed ? "flex-row-reverse justify-between" : "",
            disabled ? "cursor-not-allowed opacity-60" : "",
          ].join(" ")}
        >
          {/* Switch control — input + track + thumb as siblings */}
          <span className="relative inline-flex shrink-0 items-center">
            {/* Hidden input — positioned absolutely over the track */}
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              role="switch"
              disabled={disabled}
              className={[
                "peer absolute inset-0 z-10 cursor-pointer opacity-0",
                disabled ? "cursor-not-allowed" : "",
                className ?? "",
              ].join(" ")}
              {...inputProps}
            />

            {/* Track background */}
            <span
              className={[
                "inline-block transition-colors duration-200",
                switchSize.track,
                borderRadius,
                "bg-[var(--default,#E2E8EE)]",
                "peer-checked:bg-[--switch-color]",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-[--switch-color] peer-focus-visible:ring-offset-1",
                "peer-disabled:opacity-60",
                isInvalid ? "ring-1 ring-[var(--danger,#FF6757)]" : "",
              ].join(" ")}
              style={{
                ["--switch-color" as string]: colors.bg,
              } as React.CSSProperties}
            />

            {/* Thumb — absolute positioned over the track */}
            <span
              className={[
                "pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2",
                "inline-block bg-white shadow-sm transition-transform duration-200",
                switchSize.thumb,
                thumbRadius,
                `peer-checked:${switchSize.translate}`,
              ].join(" ")}
            />
          </span>

          {label && <span>{label}</span>}
        </label>

        {description && !isInvalid && (
          <p className="text-xs text-[var(--muted,#6C7E96)]">{description}</p>
        )}

        {isInvalid && (
          <p className="text-xs text-[var(--danger,#FF6757)]">{errorMessage}</p>
        )}
      </div>
    );
  },
);

// ═════════════════════════════════════════════════════════════
//  FormToggleButton — checkbox/radio styled as a button
// ═════════════════════════════════════════════════════════════

export interface FormToggleButtonProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Button label */
  label: string;
  /** Input type: checkbox or radio */
  type?: "checkbox" | "radio";
  /** Button style: solid or outline */
  variant?: "solid" | "outline";
  /** Color variant */
  color?: CheckColor;
  /** Size variant */
  size?: CheckSize;
  /** Additional class for the wrapper */
  wrapperClassName?: string;
}

export const FormToggleButton = forwardRef<HTMLInputElement, FormToggleButtonProps>(
  function FormToggleButton(
    {
      label,
      type = "checkbox",
      variant = "outline",
      color = "primary",
      size = "md",
      wrapperClassName,
      className,
      id,
      disabled,
      ...inputProps
    },
    ref,
  ) {
    const inputId = id ?? `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const colors = colorMap[color];

    const sizeClasses: Record<CheckSize, string> = {
      sm: "px-2.5 py-1 text-xs",
      md: "px-3.5 py-1.5 text-sm",
      lg: "px-5 py-2 text-base",
    };

    return (
      <span className={wrapperClassName ?? ""}>
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={["peer sr-only", className ?? ""].join(" ")}
          {...inputProps}
        />
        <label
          htmlFor={inputId}
          className={[
            "inline-flex cursor-pointer select-none items-center justify-center rounded-md border font-medium transition-all duration-150",
            sizeClasses[size],
            "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
            variant === "outline"
              ? [
                  "border-[--toggle-color] text-[--toggle-color] bg-transparent",
                  "peer-checked:bg-[--toggle-color] peer-checked:text-white peer-checked:border-[--toggle-color]",
                ].join(" ")
              : [
                  "border-transparent bg-[--toggle-color]/20 text-[--toggle-color]",
                  "peer-checked:bg-[--toggle-color] peer-checked:text-white",
                ].join(" "),
          ].join(" ")}
          style={{
            ["--toggle-color" as string]: colors.bg,
            ["--tw-ring-color" as string]: colors.ring,
          } as React.CSSProperties}
        >
          {label}
        </label>
      </span>
    );
  },
);

// ═════════════════════════════════════════════════════════════
//  FormToggleButtonGroup — group of toggle buttons (radio mode)
// ═════════════════════════════════════════════════════════════

export interface ToggleOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormToggleButtonGroupProps {
  /** Group label */
  label?: string;
  /** Toggle options */
  options: ToggleOption[];
  /** Currently selected value (radio) or values (checkbox) */
  value?: string | string[];
  /** Name attribute */
  name: string;
  /** Input type */
  type?: "checkbox" | "radio";
  /** Change handler for radio mode */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Change handler for checkbox mode */
  onChangeMulti?: (values: string[]) => void;
  /** Error message */
  errorMessage?: string;
  /** Button style variant */
  variant?: "solid" | "outline";
  /** Color variant */
  color?: CheckColor;
  /** Size variant */
  size?: CheckSize;
  /** Required field */
  isRequired?: boolean;
  /** Additional class for the wrapper */
  wrapperClassName?: string;
}

export function FormToggleButtonGroup({
  label,
  options,
  value,
  name,
  type = "radio",
  onChange,
  onChangeMulti,
  errorMessage,
  variant = "outline",
  color = "primary",
  size = "md",
  isRequired,
  wrapperClassName,
}: FormToggleButtonGroupProps) {
  const isInvalid = !!errorMessage;

  const isChecked = (optValue: string): boolean => {
    if (type === "radio") return value === optValue;
    return Array.isArray(value) && value.includes(optValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "radio") {
      onChange?.(e);
    } else if (onChangeMulti && Array.isArray(value)) {
      const optVal = e.target.value;
      const next = e.target.checked
        ? [...value, optVal]
        : value.filter((v) => v !== optVal);
      onChangeMulti(next);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${wrapperClassName ?? ""}`}>
      {label && (
        <span className="text-sm font-medium text-[var(--foreground,#011A42)]">
          {label}
          {isRequired && (
            <span className="ml-0.5 text-[var(--danger,#FF6757)]">*</span>
          )}
        </span>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <FormToggleButton
            key={opt.value}
            name={name}
            type={type}
            value={opt.value}
            label={opt.label}
            checked={isChecked(opt.value)}
            onChange={handleChange}
            disabled={opt.disabled}
            variant={variant}
            color={color}
            size={size}
          />
        ))}
      </div>

      {isInvalid && (
        <p className="text-xs text-[var(--danger,#FF6757)]">{errorMessage}</p>
      )}
    </div>
  );
}

// ─── Re-export types for convenience ─────────────────────────

export type { CheckSize, CheckColor };
