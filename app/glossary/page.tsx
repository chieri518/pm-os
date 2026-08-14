import Link from "next/link";
import type { Route } from "next";
import { graph } from "@/src/graph/bundle";
import { Nav } from "../nav";

export const metadata = {
  title: "Glossary",
  description: "The vocabulary the rest of the material assumes you already have.",
};

const DOMAINS = [
  "customer",
  "strategy",
  "economics",
  "experimentation",
  "metrics",
  "process",
  "technical",
] as const;

export default function GlossaryPage() {
  const terms = graph.terms();

  return (
    <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav crumb={{ label: "Glossary" }} />

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Glossary</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
          {terms.length} terms the rest of the material uses freely. These are words you need to
          parse a sentence, not subjects to study — for those, see the{" "}
          <Link
            href={"/library#concepts" as Route}
            className="text-live-400 underline-offset-2 hover:underline"
          >
            concepts
          </Link>
          .
        </p>
        <p className="mt-2 text-[13px] text-ink-400">
          Every one of these is auto-linked on first mention throughout the site. Hover any link to
          read the definition without losing your place.
        </p>
      </header>

      {DOMAINS.map((domain) => {
        const items = terms.filter((t) => t.domain === domain);
        if (!items.length) return null;
        return (
          <section key={domain} className="mb-8">
            <h2 className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-300">
              {domain} · {items.length}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((t) => (
                <Link
                  key={t.id}
                  href={`/term/${t.id}` as Route}
                  className="rounded-lg border border-ink-800 bg-ink-900/70 p-3 transition-colors hover:border-ink-600 hover:bg-ink-850"
                >
                  <div className="text-[14px] font-medium text-ink-100">{t.name}</div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-300">{t.one_line}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
