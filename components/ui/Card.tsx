import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  as?: "div" | "section" | "article";
}

const paddingClasses = {
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-7",
};

export function Card({
  children,
  className = "",
  padding = "md",
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag className={["paper-card", paddingClasses[padding], className].join(" ")}>
      {children}
    </Tag>
  );
}
