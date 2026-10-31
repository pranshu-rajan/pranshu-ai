import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
  padded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  header,
  footer,
  interactive = false,
  padded = true,
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-card transition-all duration-200 ${
        interactive
          ? "hover:border-slate-300 hover:shadow-cardHover cursor-pointer hover:-translate-y-0.5"
          : ""
      } ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
      {footer && (
        <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

