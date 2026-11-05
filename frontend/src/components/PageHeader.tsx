import React from "react";
import Badge, { BadgeVariant } from "./ui/Badge";

export interface PageHeaderBadge {
  label: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badges?: PageHeaderBadge[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badges = [],
  actions,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b border-[#E3DED6] ${className}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315]">
            {title}
          </h1>
          {badges.map((b, i) => (
            <Badge
              key={i}
              variant={b.variant || "indigo"}
              size="xs"
              dot={b.dot}
            >
              {b.label}
            </Badge>
          ))}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-[#555C68] max-w-2xl leading-relaxed font-sans">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;
