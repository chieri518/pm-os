export function Logo({ className = "size-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M11 11.5 L21.5 15 M11 11.5 L14.5 22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="11" cy="11.5" r="4" fill="currentColor" />
      <circle
        cx="21.5"
        cy="15"
        r="2.6"
        fill="var(--color-ink-950)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="14.5"
        cy="22"
        r="2.6"
        fill="var(--color-ink-950)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
