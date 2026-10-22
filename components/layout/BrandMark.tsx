import Link from "next/link";

interface BrandMarkProps {
  href?: string;
  size?: "sm" | "md";
  showName?: boolean;
}

/** Logo: ticket con signo de pregunta. Mismo dibujo que app/icon.svg. */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#ff5b1f" stroke="#1b1410" strokeWidth="4" />
      <path
        d="M17 11h30v41l-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3z"
        fill="#fff"
        stroke="#1b1410"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        transform="translate(12.8 9.2) scale(.6)"
        fill="#1b1410"
        d="M32 14c8.3 0 14 5.5 14 13.3 0 6.9-4.5 11.8-11.1 12.9v4.2h-6.2v-9.6h3.1c5 0 7.7-2.8 7.7-7.1 0-4.4-2.9-7.3-7.5-7.3-4.3 0-7.2 2.4-7.8 6.4h-6.5C18.5 19.1 24.1 14 32 14Zm-3.9 35.6a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
      />
    </svg>
  );
}

export function BrandMark({ href = "/", size = "md", showName = true }: BrandMarkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group inline-flex items-center gap-2.5 rounded-xl"
      aria-label="¿Quién puso qué? — inicio"
    >
      <BrandLogo
        className={[
          "shrink-0 transition-transform duration-300 group-hover:-rotate-6",
          size === "sm" ? "h-9 w-9" : "h-11 w-11",
        ].join(" ")}
      />
      {showName && (
        <span
          className={[
            "font-display leading-none whitespace-nowrap",
            size === "sm" ? "text-lg" : "text-xl",
          ].join(" ")}
        >
          ¿Quién puso qué?
        </span>
      )}
    </Link>
  );
}
