import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddingClasses = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div
      className={[
        "rounded-lg bg-white shadow-sm border border-stone-200",
        paddingClasses[padding],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
