import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
  padded?: boolean;
  recessed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  header,
  footer,
  interactive = false,
  padded = true,
  recessed = false,
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`rounded-lg transition-all duration-150 ${
        recessed
          ? "bg-[#EDEAE3] border border-[#E1DBD0] shadow-[inset_0_1px_2px_rgba(17,19,21,0.05),0_1px_0_rgba(255,255,255,0.7)]"
          : "bg-white border border-[#E3DED6] shadow-[0_1px_2px_rgba(17,19,21,0.04),inset_0_1px_0_rgba(255,255,255,0.95)]"
      } ${
        interactive
          ? "hover:border-[#C8C1B4] hover:shadow-[0_4px_14px_-2px_rgba(17,19,21,0.07),0_1px_3px_rgba(17,19,21,0.03)] cursor-pointer hover:-translate-y-[1px]"
          : ""
      } ${className}`}
      {...props}
    >
      {header && (
        <div className="px-4 py-3.5 border-b border-[#EBE7DF] flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={padded ? "p-4 sm:p-5" : ""}>{children}</div>
      {footer && (
        <div className="px-4 py-3 bg-[#FAF9F7] border-t border-[#EBE7DF] rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
