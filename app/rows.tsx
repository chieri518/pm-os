import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

/**
 * The compact list row the library is built from.
 *
 * The homepage used to render all 47 items as equal-weight cards, which made a
 * 4,400px page where nothing was findable and nothing was emphasised. Rows trade
 * the description's full text for scannability: you can see twenty at once, and the
 * full text is one click away. The blurb truncates on wide screens for a clean
 * column edge and wraps on narrow ones, where there is no column to keep.
 */
export function Row({
  href,
  name,
  blurb,
  meta,
}: {
  href: string;
  name: string;
  blurb?: string;
  meta?: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href as Route}
        className="flex flex-col gap-0.5 rounded-lg px-2 py-2 transition-colors hover:bg-ink-850 sm:flex-row sm:items-baseline sm:gap-3"
      >
        <span className="text-[14px] font-medium leading-snug text-ink-100 sm:w-[240px] sm:shrink-0">
          {name}
        </span>
        {blurb && (
          <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink-400 sm:truncate">
            {blurb}
          </span>
        )}
        {meta && <span className="shrink-0 sm:ml-auto">{meta}</span>}
      </Link>
    </li>
  );
}

/** A labelled run of rows — the sub-taxonomy inside a section. */
export function RowGroup({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 px-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-300">{label}</span>
        {note && <span className="text-[11px] text-ink-400">{note}</span>}
      </div>
      <ul className="divide-y divide-ink-800/50 border-t border-ink-800/50">{children}</ul>
    </div>
  );
}

/** Section shell with an anchor target, so the jump strip and the doors can link in. */
export function LibrarySection({
  id,
  title,
  count,
  note,
  children,
}: {
  id: string;
  title: string;
  count: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-100">
          {title}
        </h2>
        <span className="font-mono text-[10px] text-live-400">{count}</span>
        {note && <span className="text-xs text-ink-400">{note}</span>}
      </div>
      {children}
    </section>
  );
}

/** Small mono meta label for the right-hand column. */
export function Meta({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">{children}</span>;
}
