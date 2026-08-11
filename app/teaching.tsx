import type { ReactNode } from "react";
import type { WorkedExample } from "@/src/schema/nodes";
import { z } from "zod";

/**
 * Shared presentation for teaching content.
 *
 * Concept, framework, and question pages render the same blocks — mechanism,
 * strong-versus-weak phrasing, worked examples. Keeping these in one place is
 * what stops the three page types drifting into three different visual languages
 * for identical content.
 */

export function Section({
  title,
  note,
  tone,
  children,
}: {
  title: string;
  note?: string;
  tone?: "warn";
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-baseline gap-x-3">
        <h2
          className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
            tone === "warn" ? "text-warn-400" : "text-ink-300"
          }`}
        >
          {title}
        </h2>
        {note && <span className="text-xs text-ink-400">{note}</span>}
      </div>
      {children}
    </section>
  );
}

export function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[15px] leading-relaxed text-ink-300 ${className}`}>{children}</p>;
}

export function Quote({
  tone,
  label,
  children,
}: {
  tone: "strong" | "weak";
  label: string;
  children: ReactNode;
}) {
  const strong = tone === "strong";
  return (
    <div
      className={`rounded-lg border p-3 ${
        strong ? "border-live-600/30 bg-live-600/[0.05]" : "border-ink-700 bg-ink-850/60"
      }`}
    >
      <div
        className={`mb-1 font-mono text-[10px] uppercase tracking-wider ${
          strong ? "text-live-400" : "text-ink-400"
        }`}
      >
        {label}
      </div>
      <p className={`text-[14px] leading-relaxed ${strong ? "text-ink-100" : "text-ink-400"}`}>
        &ldquo;{children}&rdquo;
      </p>
    </div>
  );
}

export function WorkedExampleCards({ example }: { example: z.infer<typeof WorkedExample> }) {
  return (
    <>
      <p className="mb-3 text-[15px] leading-relaxed text-ink-100">{example.situation}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-ink-800 bg-ink-900 p-3">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-400">
            The naive move
          </div>
          <p className="text-[13px] leading-relaxed text-ink-300">{example.without}</p>
        </div>
        <div className="rounded-lg border border-live-600/30 bg-live-600/[0.05] p-3">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-live-400">
            What the concept suggests
          </div>
          <p className="text-[13px] leading-relaxed text-ink-300">{example.with}</p>
        </div>
      </div>
      <p className="mt-3 border-l-2 border-ink-600 pl-3 text-[15px] leading-relaxed text-ink-100">
        {example.takeaway}
      </p>
    </>
  );
}

export function MistakeList({ items }: { items: { mistake: string; instead: string }[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((p) => (
        <div key={p.mistake} className="rounded-lg border border-warn-400/20 bg-warn-400/[0.03] p-3">
          <div className="text-[14px] font-medium text-ink-100">{p.mistake}</div>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-300">{p.instead}</p>
        </div>
      ))}
    </div>
  );
}
