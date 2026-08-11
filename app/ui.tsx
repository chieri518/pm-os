"use client";

import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-ink-800 bg-ink-900/70 backdrop-blur-sm ${className}`}
    >
      <header className="flex items-baseline justify-between gap-3 border-b border-ink-800 px-4 py-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Segmented<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-center gap-3">
      <div className="min-w-0">
        <div className="truncate font-mono text-[11px] text-ink-300">{label}</div>
        {hint && <div className="truncate text-[10px] text-ink-400">{hint}</div>}
      </div>
      <div className="flex gap-1 rounded-lg bg-ink-850 p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={`flex-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium capitalize leading-tight transition-colors ${
                active
                  ? "bg-ink-700 text-ink-100 shadow-sm"
                  : "text-ink-400 hover:bg-ink-800 hover:text-ink-300"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-ink-600 bg-ink-700 text-ink-100"
          : "border-ink-800 bg-ink-850 text-ink-400 hover:border-ink-700 hover:text-ink-300"
      }`}
    >
      {children}
    </button>
  );
}

export function EvidenceTag({ strength }: { strength: string }) {
  const styles: Record<string, string> = {
    replicated: "border-live-600/40 bg-live-600/10 text-live-400",
    supported: "border-ink-600 bg-ink-800 text-ink-300",
    heuristic: "border-ink-700 bg-ink-850 text-ink-400",
    contested: "border-warn-400/40 bg-warn-400/10 text-warn-400",
  };
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        styles[strength] ?? styles.heuristic
      }`}
    >
      {strength}
    </span>
  );
}
