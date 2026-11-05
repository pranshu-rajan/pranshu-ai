import React from "react";

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
}: SegmentedControlProps<T>) {
  const isSm = size === "sm";

  return (
    <div
      role="tablist"
      className={`inline-flex p-0.5 bg-[#EDEAE3] rounded-md border border-[#E1DBD0] shadow-[inset_0_1px_2px_rgba(17,19,21,0.05)] select-none ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={`relative flex items-center justify-center font-medium rounded transition-all duration-150 outline-none ${
              isSm
                ? "px-2.5 py-1 text-[11px] gap-1.5"
                : "px-3 py-1.5 text-xs gap-2"
            } ${
              isSelected
                ? "bg-white text-[#111315] shadow-[0_1px_2px_rgba(17,19,21,0.06),inset_0_1px_0_rgba(255,255,255,1)] border border-[#DCD5C9] font-semibold"
                : "text-[#555C68] hover:text-[#111315] hover:bg-[#E5E1D8]/60 border border-transparent"
            }`}
          >
            {option.icon && (
              <span
                className={`transition-colors shrink-0 ${
                  isSelected ? "text-[#0935B8]" : "text-[#7E8794]"
                }`}
              >
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.badge && <span className="ml-1">{option.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
