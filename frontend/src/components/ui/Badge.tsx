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
    bg: "bg-[#EEF3FF]",
    text: "text-[#0935B8]",
    dot: "bg-[#0935B8]",
    border: "border-[#CFDEFE]",
  },
  violet: {
    bg: "bg-[#F3EFFE]",
    text: "text-[#5B21B6]",
    dot: "bg-[#6D28D9]",
    border: "border-[#DDD0FB]",
  },
  amber: {
    bg: "bg-[#FFF7ED]",
    text: "text-[#9A3412]",
    dot: "bg-[#EA580C]",
    border: "border-[#FED7AA]",
  },
  emerald: {
    bg: "bg-[#F0FDF4]",
    text: "text-[#065F46]",
    dot: "bg-[#0D5F52]",
    border: "border-[#BBF7D0]",
  },
  rose: {
    bg: "bg-[#FFF1F2]",
    text: "text-[#9F1239]",
    dot: "bg-[#E11D48]",
    border: "border-[#FECDD3]",
  },
  slate: {
    bg: "bg-[#F3F1EC]",
    text: "text-[#403B35]",
    dot: "bg-[#7A7264]",
    border: "border-[#E2DDD3]",
  },
  cyan: {
    bg: "bg-[#F0F9FF]",
    text: "text-[#075985]",
    dot: "bg-[#0284C7]",
    border: "border-[#BAE6FD]",
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[10px] gap-1 font-mono tracking-wide",
  sm: "px-2 py-0.5 text-[11px] gap-1.5 font-mono tracking-tight",
  md: "px-2.5 py-1 text-xs gap-1.5 font-medium",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "indigo",
  size = "sm",
  dot = false,
  className = "",
}) => {
  const v = variantStyles[variant] || variantStyles.indigo;
  const s = sizeStyles[size] || sizeStyles.sm;

  return (
    <span
      className={`inline-flex items-center rounded border font-medium select-none shadow-[0_1px_1px_rgba(0,0,0,0.02)] ${v.bg} ${v.text} ${v.border} ${s} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${v.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
