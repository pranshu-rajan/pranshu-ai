import React from "react";

export type BadgeVariant =
  | "indigo"
  | "violet"
  | "amber"
  | "emerald"
  | "rose"
  | "slate"
  | "cyan";

export type BadgeSize = "xs" | "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    border: "border-indigo-200/60",
  },
  violet: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
    border: "border-purple-200/60",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-amber-500",
    border: "border-amber-200/60",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200/60",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-200/60",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    border: "border-slate-200",
  },
  cyan: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    dot: "bg-cyan-500",
    border: "border-cyan-200/60",
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[10px] gap-1",
  sm: "px-2.5 py-0.5 text-xs gap-1.5",
  md: "px-3 py-1 text-xs gap-2",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "indigo",
  size = "sm",
  dot = false,
  className = "",
}) => {
  const styles = variantStyles[variant] || variantStyles.indigo;
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${styles.dot} shrink-0`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;

