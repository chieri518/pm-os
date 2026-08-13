import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { graph } from "@/src/graph/bundle";
import { buildLinkIndex, segment, type LinkTarget } from "@/src/graph/linker";

const index = buildLinkIndex(graph);

const TYPE_LABEL: Record<string, string> = {
  term: "term",
  concept: "concept",
  heuristic: "heuristic",
  framework: "framework",
  question_type: "question type",
  company_lens: "company",
};

/**
 * Hover preview, implemented in pure CSS.
 *
 * A JS popover would need a client component for every inline link on a page that
 * can carry a hundred of them, so this is group-hover and a transform instead —
 * no hydration, no per-link JS. The trade is that it cannot flip away from a
 * viewport edge; `max-w` plus centring keeps that tolerable in practice.
 */
function InlineLink({ target, children }: { target: LinkTarget; children: ReactNode }) {
  return (
    <span className="group/link relative inline">
      <Link
        href={target.href as Route}
        className="text-ink-100 underline decoration-ink-600 decoration-dotted underline-offset-[3px] transition-colors hover:decoration-live-400 hover:text-live-400"
      >
        {children}
      </Link>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 hidden w-72 max-w-[85vw] -translate-x-1/2 rounded-lg border border-ink-700 bg-ink-850 p-2.5 text-left shadow-xl group-hover/link:block"
      >
        <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-wider text-ink-400">
          {TYPE_LABEL[target.type] ?? target.type}
        </span>
        <span className="block text-[13px] font-medium leading-snug text-ink-100">
          {target.label}
        </span>
        <span className="mt-1 block text-[12px] leading-relaxed text-ink-300">
          {target.summary.length > 190 ? `${target.summary.slice(0, 190).trim()}…` : target.summary}
        </span>
      </span>
    </span>
  );
}

export type Linker = (text: string | undefined) => ReactNode;

/**
 * Build a linker scoped to one page render.
 *
 * The returned function closes over a `seen` set, which is what makes "first
 * mention only" work — call it for every string on the page, in reading order.
 */
export function createLinker(selfKey?: string): Linker {
  const seen = new Set<string>();
  return (text) => {
    if (!text) return text ?? null;
    const parts = segment(text, index, seen, selfKey);
    if (parts.length === 1 && !parts[0]!.target) return text;
    return parts.map((p, i) =>
      p.target ? (
        <InlineLink key={`${p.target.key}-${i}`} target={p.target}>
          {p.text}
        </InlineLink>
      ) : (
        <span key={i}>{p.text}</span>
      )
    );
  };
}

/** A linker that never links — for surfaces where inline links would be noise. */
export const noLink: Linker = (text) => text ?? null;
