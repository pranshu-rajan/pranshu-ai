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
      className={`inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 select-none ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={`relative flex items-center justify-center font-medium rounded-lg transition-all duration-200 outline-none ${
              isSm
                ? "px-2.5 py-1 text-xs gap-1.5"
                : "px-3.5 py-1.5 text-xs gap-2"
            } ${
              isSelected
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            {option.icon && (
              <span
                className={`transition-colors shrink-0 ${
                  isSelected ? "text-indigo-600" : "text-slate-400"
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

