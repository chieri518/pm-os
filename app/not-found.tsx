import Link from "next/link";
import type { Route } from "next";
import { Nav } from "./nav";

export const metadata = { title: "Not found" };

/*
 * Most 404s here are a guessed or mistyped slug — "/concept/nps" rather than
 * "/concept/survey-metrics-nps". So rather than a dead end, point at the two
 * places that resolve a guess: search, and the full list.
 */
const WAYS_ON: { href: Route; title: string; blurb: string }[] = [
  {
    href: "/library" as Route,
    title: "Everything, in one list",
    blurb: "Question types, concepts, frameworks, heuristics and company lenses.",
  },
  {
    href: "/interviewer" as Route,
    title: "Interviewer guides",
    blurb: "Situation briefs, probe ladders and signal checklists for nine questions.",
  },
  {
    href: "/glossary" as Route,
    title: "Glossary",
    blurb: "If you were looking for a term, it is probably defined here.",
  },
];

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav />

      <header className="mb-6 max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-wider text-live-400">404</p>
        <h1 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight text-ink-100">
          That page is not in the graph.
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-400">
          The link may be old, or the slug guessed. Press{" "}
          <kbd className="rounded border border-ink-700 px-1 font-mono text-[11px] text-ink-300">
            ⌘K
          </kbd>{" "}
          to search everything, or start from one of these.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {WAYS_ON.map((w) => (
          <Link
            key={w.href}
            href={w.href}
            className="group flex flex-col rounded-xl border border-ink-800 bg-ink-900/70 p-4 transition-colors hover:border-ink-600 hover:bg-ink-850"
          >
            <span className="text-[15px] font-medium text-ink-100">
              {w.title}
              <span
                aria-hidden
                className="ml-1.5 inline-block text-ink-600 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-400"
              >
                →
              </span>
            </span>
            <span className="mt-1.5 text-[13px] leading-relaxed text-ink-300">{w.blurb}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
