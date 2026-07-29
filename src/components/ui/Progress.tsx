import * as React from "react";

// ─── Types ───────────────────────────────────────────────────

export type ProgressColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "dark";

export type ProgressSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value (0-100) */
  value?: number;
  /** Max value (default 100) */
  max?: number;
  /** Color theme */
  color?: ProgressColor;
  /** Size/Height of the progress bar */
  size?: ProgressSize;
  /** Render striped background */
  isStriped?: boolean;
  /** Animate stripes (requires isStriped) */
  isAnimated?: boolean;
  /** Uses light themed background for the track */
  isLightTrack?: boolean;
  /** Text label inside the progress bar */
  label?: React.ReactNode;
  /** Show value percentage automatically */
  showValueLabel?: boolean;
  /** Additional class for the inner bar */
  barClassName?: string;
  /** Additional outer container class */
  className?: string;
}

// ─── Color Maps ──────────────────────────────────────────────

const trackColors: Record<ProgressColor, string> = {
  primary: "bg-primary/10",
  secondary: "bg-secondary/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  danger: "bg-danger/10",
  info: "bg-info/10",
  dark: "bg-dark/10",
};

const barColors: Record<ProgressColor, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  dark: "bg-dark",
};

// ─── Size Maps ───────────────────────────────────────────────

const sizeClasses: Record<ProgressSize, string> = {
  xs: "h-1 text-[0px]",     // 4px
  sm: "h-2 text-[0.6rem]",  // 8px
  md: "h-4 text-xs",        // 16px
  lg: "h-5 text-sm",        // 20px
  xl: "h-6 text-base",      // 24px
};

// ═════════════════════════════════════════════════════════════
//  Progress
// ═════════════════════════════════════════════════════════════

export function Progress({
  value = 0,
  max = 100,
  color = "primary",
  size = "md",
  isStriped = false,
  isAnimated = false,
  isLightTrack = false,
  label,
  showValueLabel = false,
  barClassName = "",
  className = "",
  ...props
}: ProgressProps) {
  // Clamp value between 0 and max
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  // Base track classes
  const trackBg = isLightTrack ? trackColors[color] : "bg-border";
  const trackClass = `flex w-full overflow-hidden rounded-full ${trackBg} ${sizeClasses[size]} ${className}`;

  // Inner bar classes
  const barClass = `flex flex-col justify-center overflow-hidden text-center whitespace-nowrap text-white transition-all duration-500 ease-in-out ${barColors[color]} ${barClassName}`;

  // Stripe & Animation CSS (Inlined for portability)
  const stripeStyle: React.CSSProperties = isStriped
    ? {
        backgroundImage:
          "linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent)",
        backgroundSize: "1rem 1rem",
      }
    : {};

  const animatedStyle: React.CSSProperties = isAnimated
    ? {
        animation: "progress-bar-stripes 1s linear infinite",
      }
    : {};

  const barStyle: React.CSSProperties = {
    width: `${percentage}%`,
    ...stripeStyle,
    ...animatedStyle,
  };

  return (
    <div
      className={trackClass}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div className={barClass} style={barStyle}>
        {showValueLabel && !label ? `${Math.round(percentage)}%` : label}
      </div>
    </div>
  );
}
