import React from "react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed border-[#DCD5C9] bg-[#EDEAE3]/40 ${className}`}
    >
      {icon && (
        <div className="w-10 h-10 rounded-md bg-white border border-[#E3DED6] shadow-[0_1px_2px_rgba(17,19,21,0.04)] flex items-center justify-center text-[#0935B8] mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-xs font-semibold text-[#111315] mb-1 tracking-tight">{title}</h3>
      {description && (
        <p className="text-[11px] text-[#555C68] max-w-sm mb-4 leading-relaxed font-sans">
          {description}
        </p>
      )}
      {action && (
        <Button
          size="sm"
          variant="secondary"
          onClick={action.onClick}
          icon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
