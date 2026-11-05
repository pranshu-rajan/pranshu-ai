import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0935B8] hover:bg-[#072CA0] active:bg-[#062382] text-white shadow-[0_1px_2px_rgba(9,53,184,0.2),inset_0_1px_0_rgba(255,255,255,0.22)] border border-[#082B96] focus-visible:ring-[#0935B8]/30",
  secondary:
    "bg-white hover:bg-[#FAF9F7] active:bg-[#F3F1EC] text-[#111315] border border-[#E3DED6] shadow-[0_1px_2px_rgba(17,19,21,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-[#C8C1B4] focus-visible:ring-stone-400/40",
  subtle:
    "bg-[#EEF3FF] hover:bg-[#DBE6FE] active:bg-[#BED3FE] text-[#0935B8] border border-[#CFDEFE] shadow-[0_1px_2px_rgba(9,53,184,0.04)] focus-visible:ring-[#0935B8]/30",
  ghost:
    "bg-transparent hover:bg-[#EDEAE3] active:bg-[#E3DED6] text-[#403B35] hover:text-[#111315] border border-transparent focus-visible:ring-stone-400/40",
  danger:
    "bg-[#BE123C] hover:bg-[#9F1239] active:bg-[#881337] text-white shadow-[0_1px_2px_rgba(190,18,60,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#9F1239] focus-visible:ring-[#BE123C]/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-xs gap-1.5 rounded",
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-xs gap-2 rounded-md font-medium tracking-tight",
  lg: "h-10 px-4 text-sm gap-2.5 rounded-lg font-medium tracking-tight",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      className = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none active:translate-y-[0.5px] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === "right" && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
