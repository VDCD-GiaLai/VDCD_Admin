"use client";

import {
  type SelectHTMLAttributes,
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

// ─── Shared Types ────────────────────────────────────────────

type SelectSize = "sm" | "md" | "lg";
type SelectRadius = "none" | "md" | "full";

// ─── Size / Radius mappings ──────────────────────────────────

const sizeClasses: Record<SelectSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2.5 text-base",
};

const labelSizeClasses: Record<SelectSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};

const radiusClasses: Record<SelectRadius, string> = {
  none: "rounded-none",
  md: "rounded-md",
  full: "rounded-full",
};

// ─── Chevron SVG (encoded for bg-image) ──────────────────────

const CHEVRON_SVG =
  "url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236C7E96%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')";

// ─── Option Types ────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

type SelectItems = SelectOption[] | SelectOptionGroup[];

/** Type guard: is the items array option groups? */
function isOptionGroups(items: SelectItems): items is SelectOptionGroup[] {
  return items.length > 0 && "options" in items[0];
}

/** Flatten grouped options to a flat list */
function flattenOptions(items: SelectItems): SelectOption[] {
  if (isOptionGroups(items)) {
    return items.flatMap((g) => g.options);
  }
  return items;
}

// ═════════════════════════════════════════════════════════════
//  FormSelect — native <select> (enhanced)
// ═════════════════════════════════════════════════════════════

interface FormSelectBaseProps {
  /** Label displayed above the select */
  label?: string;
  /** Helper text displayed below */
  helperText?: string;
  /** Error message — overrides helperText, shows red styling */
  errorMessage?: string;
  /** Select size */
  size?: SelectSize;
  /** Border radius */
  radius?: SelectRadius;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Wrapper class */
  wrapperClassName?: string;
}

export interface FormSelectProps
  extends FormSelectBaseProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Flat options or grouped options */
  options: SelectItems;
  /** Placeholder option text (first, disabled) */
  placeholderOption?: string;
  /** Number of visible options (sets the `size` attribute on <select>) */
  visibleOptions?: number;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(
    {
      label,
      helperText,
      errorMessage,
      size = "md",
      radius = "md",
      isRequired,
      wrapperClassName,
      className,
      options,
      placeholderOption,
      visibleOptions,
      id,
      multiple,
      ...selectProps
    },
    ref,
  ) {
    const isInvalid = !!errorMessage;
    const selectId = id ?? (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    const selectClass = [
      "w-full border bg-[var(--field-background,#fff)] text-[var(--field-foreground,#011A42)]",
      "transition-colors duration-150",
      // Only show chevron + appearance-none if NOT multiple/visibleOptions
      !multiple && !visibleOptions
        ? `appearance-none bg-[${CHEVRON_SVG}] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10`
        : "",
      "focus:border-[var(--focus,#985FFD)] focus:outline-none focus:ring-1 focus:ring-[var(--focus,#985FFD)]",
      "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[var(--surface-secondary,#F9F7FC)]",
      sizeClasses[size],
      radiusClasses[radius],
      isInvalid
        ? "border-[var(--danger,#FF6757)] focus:border-[var(--danger,#FF6757)] focus:ring-[var(--danger,#FF6757)]"
        : "border-[var(--field-border,#E2E8EE)]",
      className ?? "",
    ].join(" ");

    const renderOptions = () => {
      if (isOptionGroups(options)) {
        return options.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ));
      }
      return options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ));
    };

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName ?? ""}`}>
        {label && (
          <label
            htmlFor={selectId}
            className={`font-medium text-[var(--foreground,#011A42)] ${labelSizeClasses[size]}`}
          >
            {label}
            {isRequired && (
              <span className="ml-0.5 text-[var(--danger,#FF6757)]">*</span>
            )}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={selectClass}
          multiple={multiple}
          size={visibleOptions}
          {...selectProps}
        >
          {placeholderOption && (
            <option value="" disabled>
              {placeholderOption}
            </option>
          )}
          {renderOptions()}
        </select>

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
//  FormSearchSelect — searchable single/multi-select with tags
//  (Replaces Choices.js from Vyzor)
// ═════════════════════════════════════════════════════════════

export interface FormSearchSelectProps {
  /** Label displayed above */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Select size */
  size?: SelectSize;
  /** Border radius */
  radius?: SelectRadius;
  /** Required field */
  isRequired?: boolean;
  /** Wrapper class */
  wrapperClassName?: string;
  /** Flat or grouped options */
  options: SelectItems;
  /** Placeholder text */
  placeholder?: string;
  /** Enable multi-select (tags) */
  isMulti?: boolean;
  /** Show search input */
  isSearchable?: boolean;
  /** Allow clearing selection */
  isClearable?: boolean;
  /** Show remove button on tags */
  isRemovable?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Max number of selections (multi only) */
  maxSelections?: number;
  /** No options message */
  noOptionsMessage?: string;

  // ── Controlled mode ──
  /** Single value (controlled) */
  value?: string | null;
  /** Multi values (controlled) */
  values?: string[];
  /** Change handler (single) */
  onChange?: (value: string | null) => void;
  /** Change handler (multi) */
  onChangeMulti?: (values: string[]) => void;

  /** HTML id */
  id?: string;
  /** Name for form submission */
  name?: string;
}

export function FormSearchSelect({
  label,
  helperText,
  errorMessage,
  size = "md",
  radius = "md",
  isRequired,
  wrapperClassName,
  options,
  placeholder = "Chọn...",
  isMulti = false,
  isSearchable = true,
  isClearable = false,
  isRemovable = true,
  disabled = false,
  maxSelections,
  noOptionsMessage = "Không tìm thấy kết quả",
  value,
  values = [],
  onChange,
  onChangeMulti,
  id,
  name,
}: FormSearchSelectProps) {
  const isInvalid = !!errorMessage;
  const selectId = id ?? (label ? `search-select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOptions = useMemo(() => flattenOptions(options), [options]);

  // ── Click outside to close ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Filtered options ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;

    if (isOptionGroups(options)) {
      return options
        .map((g) => ({
          ...g,
          options: g.options.filter((o) => o.label.toLowerCase().includes(q)),
        }))
        .filter((g) => g.options.length > 0);
    }
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const flatFiltered = useMemo(() => flattenOptions(filtered), [filtered]);

  // ── Selected labels ──
  const getLabel = useCallback(
    (val: string) => allOptions.find((o) => o.value === val)?.label ?? val,
    [allOptions],
  );

  // ── Select/deselect logic ──
  const handleSelect = (optValue: string) => {
    if (isMulti) {
      const current = values;
      if (current.includes(optValue)) {
        onChangeMulti?.(current.filter((v) => v !== optValue));
      } else {
        if (maxSelections && current.length >= maxSelections) return;
        onChangeMulti?.([...current, optValue]);
      }
      setSearch("");
      inputRef.current?.focus();
    } else {
      onChange?.(optValue);
      setIsOpen(false);
      setSearch("");
    }
  };

  const handleRemoveTag = (optValue: string) => {
    onChangeMulti?.(values.filter((v) => v !== optValue));
  };

  const handleClear = () => {
    if (isMulti) {
      onChangeMulti?.([]);
    } else {
      onChange?.(null);
    }
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
    }
    // Backspace removes last tag in multi mode
    if (e.key === "Backspace" && isMulti && !search && values.length > 0) {
      onChangeMulti?.(values.slice(0, -1));
    }
  };

  const hasValue = isMulti ? values.length > 0 : !!value;

  // ── Size tokens ──
  const inputPadding: Record<SelectSize, string> = {
    sm: "min-h-[30px] text-xs",
    md: "min-h-[38px] text-sm",
    lg: "min-h-[46px] text-base",
  };

  const tagSize: Record<SelectSize, string> = {
    sm: "text-[10px] px-1.5 py-0",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-0.5",
  };

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName ?? ""}`}>
      {label && (
        <label
          htmlFor={selectId}
          className={`font-medium text-[var(--foreground,#011A42)] ${labelSizeClasses[size]}`}
        >
          {label}
          {isRequired && (
            <span className="ml-0.5 text-[var(--danger,#FF6757)]">*</span>
          )}
        </label>
      )}

      {/* Hidden input for form submission */}
      {name && (
        isMulti
          ? values.map((v) => <input key={v} type="hidden" name={name} value={v} />)
          : <input type="hidden" name={name} value={value ?? ""} />
      )}

      <div ref={containerRef} className="relative">
        {/* Trigger / Input area */}
        <div
          className={[
            "flex cursor-pointer flex-wrap items-center gap-1.5 border bg-[var(--field-background,#fff)]",
            "px-3 transition-colors duration-150",
            radiusClasses[radius],
            inputPadding[size],
            isOpen
              ? "border-[var(--focus,#985FFD)] ring-1 ring-[var(--focus,#985FFD)]"
              : isInvalid
                ? "border-[var(--danger,#FF6757)]"
                : "border-[var(--field-border,#E2E8EE)]",
            disabled ? "cursor-not-allowed opacity-60 bg-[var(--surface-secondary,#F9F7FC)]" : "",
          ].join(" ")}
          onClick={() => {
            if (disabled) return;
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          {/* Multi: tags */}
          {isMulti &&
            values.map((v) => (
              <span
                key={v}
                className={[
                  "inline-flex items-center gap-1 rounded bg-[var(--accent,#985FFD)]/10 text-[var(--accent,#985FFD)] font-medium",
                  tagSize[size],
                ].join(" ")}
              >
                {getLabel(v)}
                {isRemovable && !disabled && (
                  <button
                    type="button"
                    className="ml-0.5 text-[var(--accent,#985FFD)]/60 transition-colors hover:text-[var(--accent,#985FFD)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(v);
                    }}
                    tabIndex={-1}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}

          {/* Search input or display value */}
          {isSearchable || isMulti ? (
            <input
              ref={inputRef}
              id={selectId}
              type="text"
              className={[
                "min-w-[60px] flex-1 border-0 bg-transparent outline-none placeholder:text-[var(--field-placeholder,#6C7E96)]",
                "p-0",
                sizeClasses[size].split(" ").find((c) => c.startsWith("text-")) ?? "text-sm",
              ].join(" ")}
              placeholder={
                isMulti
                  ? values.length > 0
                    ? isSearchable ? "Tìm thêm..." : ""
                    : placeholder
                  : value
                    ? getLabel(value)
                    : placeholder
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => { if (!isOpen) setIsOpen(true); }}
              onKeyDown={handleKeyDown}
              readOnly={!isSearchable}
              disabled={disabled}
              autoComplete="off"
            />
          ) : (
            <span
              className={[
                "flex-1 truncate",
                !hasValue ? "text-[var(--field-placeholder,#6C7E96)]" : "text-[var(--field-foreground,#011A42)]",
                sizeClasses[size].split(" ").find((c) => c.startsWith("text-")) ?? "text-sm",
              ].join(" ")}
            >
              {value ? getLabel(value) : placeholder}
            </span>
          )}

          {/* Right icons */}
          <div className="ml-auto flex shrink-0 items-center gap-1 pl-2">
            {isClearable && hasValue && !disabled && (
              <button
                type="button"
                className="text-[var(--muted,#6C7E96)] transition-colors hover:text-[var(--foreground,#011A42)]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                tabIndex={-1}
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronIcon
              className={[
                "h-4 w-4 text-[var(--muted,#6C7E96)] transition-transform duration-200",
                isOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div
            className={[
              "absolute z-50 mt-1 w-full overflow-auto border border-[var(--field-border,#E2E8EE)] bg-[var(--field-background,#fff)] shadow-lg",
              "max-h-60",
              radiusClasses[radius],
            ].join(" ")}
          >
            {flatFiltered.length === 0 ? (
              <div className="px-3 py-2.5 text-center text-xs text-[var(--muted,#6C7E96)]">
                {noOptionsMessage}
              </div>
            ) : isOptionGroups(filtered) ? (
              filtered.map((group) => (
                <div key={group.label}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted,#6C7E96)]">
                    {group.label}
                  </div>
                  {group.options.map((opt) => (
                    <DropdownItem
                      key={opt.value}
                      option={opt}
                      isSelected={isMulti ? values.includes(opt.value) : value === opt.value}
                      isMulti={isMulti}
                      size={size}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ))
            ) : (
              (filtered as SelectOption[]).map((opt) => (
                <DropdownItem
                  key={opt.value}
                  option={opt}
                  isSelected={isMulti ? values.includes(opt.value) : value === opt.value}
                  isMulti={isMulti}
                  size={size}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        )}
      </div>

      {isInvalid ? (
        <p className="text-xs text-[var(--danger,#FF6757)]">{errorMessage}</p>
      ) : helperText ? (
        <p className="text-xs text-[var(--muted,#6C7E96)]">{helperText}</p>
      ) : null}
    </div>
  );
}

// ─── Dropdown item sub-component ─────────────────────────────

function DropdownItem({
  option,
  isSelected,
  isMulti,
  size,
  onSelect,
}: {
  option: SelectOption;
  isSelected: boolean;
  isMulti: boolean;
  size: SelectSize;
  onSelect: (value: string) => void;
}) {
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <button
      type="button"
      className={[
        "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
        textSize,
        option.disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-[var(--accent,#985FFD)]/5",
        isSelected && !isMulti
          ? "bg-[var(--accent,#985FFD)]/10 font-medium text-[var(--accent,#985FFD)]"
          : "text-[var(--field-foreground,#011A42)]",
      ].join(" ")}
      onClick={() => !option.disabled && onSelect(option.value)}
      disabled={option.disabled}
    >
      {isMulti && (
        <span
          className={[
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
            isSelected
              ? "border-[var(--accent,#985FFD)] bg-[var(--accent,#985FFD)]"
              : "border-[var(--field-border,#E2E8EE)]",
          ].join(" ")}
        >
          {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
        </span>
      )}
      <span className="truncate">{option.label}</span>
      {isSelected && !isMulti && (
        <CheckIcon className="ml-auto h-4 w-4 shrink-0 text-[var(--accent,#985FFD)]" />
      )}
    </button>
  );
}

// ─── Inline SVG icons ────────────────────────────────────────

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}
