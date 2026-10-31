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
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80 ${className}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {badges.map((b, i) => (
            <Badge
              key={i}
              variant={b.variant || "indigo"}
              size="sm"
              dot={b.dot}
            >
              {b.label}
            </Badge>
          ))}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;

