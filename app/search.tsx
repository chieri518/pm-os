"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import raw from "@/src/generated/search.json";

interface Entry {
  id: string;
  type: string;
  href: string;
  label: string;
  summary: string;
}

const ENTRIES = raw as Entry[];

const TYPE_COPY: Record<string, string> = {
  term: "term",
  concept: "concept",
  heuristic: "heuristic",
  framework: "framework",
  question_type: "question",
  company_lens: "company",
};

/**
 * Subsequence match, the same rule editors use for fuzzy file open: every
 * character of the query must appear in order, but not necessarily adjacently, so
 * "unec" finds "Unit Economics". Score rewards earlier and tighter matches, and a
 * prefix hit on the label outranks everything so exact typing behaves predictably.
 */
function score(query: string, entry: Entry): number {
  const q = query.toLowerCase();
  const label = entry.label.toLowerCase();
  if (label.startsWith(q)) return 1000 - label.length;
  if (label.includes(q)) return 600 - label.indexOf(q);

  let i = 0;
  let first = -1;
  let gaps = 0;
  let last = -1;
  for (let c = 0; c < label.length && i < q.length; c++) {
    if (label[c] === q[i]) {
      if (first === -1) first = c;
      if (last !== -1 && c - last > 1) gaps += c - last;
      last = c;
      i++;
    }
  }
  if (i === q.length) return 300 - first - gaps;
  return entry.summary.toLowerCase().includes(q) ? 50 : -1;
}

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    if (!query.trim()) return ENTRIES.slice(0, 8);
    return ENTRIES.map((e) => ({ e, s: score(query.trim(), e) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 10)
      .map((r) => r.e);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      // "/" opens search, but not while the user is typing into something.
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Focus after paint so the input exists.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-900 px-2.5 py-1.5 text-xs text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-300"
        aria-label="Search"
      >
        <span>Search</span>
        <kbd className="rounded border border-ink-700 bg-ink-850 px-1 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>
    );
  }

  const go = (href: string) => {
    setOpen(false);
    router.push(href as Route);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close search"
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 cursor-default bg-ink-950/70 backdrop-blur-sm"
      />
      <div className="fixed left-1/2 top-[12vh] z-50 w-[min(620px,92vw)] -translate-x-1/2 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            }
            if (e.key === "Enter" && results[active]) go(results[active]!.href);
          }}
          placeholder="Search concepts, terms, frameworks, companies…"
          className="w-full border-b border-ink-800 bg-transparent px-4 py-3.5 text-[15px] text-ink-100 outline-none placeholder:text-ink-600"
        />
        <ul className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-ink-400">Nothing matches that.</li>
          )}
          {results.map((r, i) => (
            <li key={`${r.type}:${r.id}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.href)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                  i === active ? "bg-ink-800" : "hover:bg-ink-850"
                }`}
              >
                <span className="mt-0.5 w-16 shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                  {TYPE_COPY[r.type] ?? r.type}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-ink-100">{r.label}</span>
                  <span className="block truncate text-[12.5px] text-ink-400">{r.summary}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-3 border-t border-ink-800 px-3 py-2 font-mono text-[10px] text-ink-600">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
          <span className="ml-auto">{ENTRIES.length} entries</span>
        </div>
      </div>
    </>
  );
}
