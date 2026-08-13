import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { graph } from "@/src/graph/bundle";
import type { Term } from "@/src/schema/nodes";
import { buildLinkIndex } from "@/src/graph/linker";
import { Nav } from "../../nav";
import { Section } from "../../teaching";
import { Backlinks } from "../../backlinks";
import { createLinker } from "../../linked";

const index = buildLinkIndex(graph);
const byKey = new Map(index.targets.map((t) => [t.key, t]));

export function generateStaticParams() {
  return graph.terms().map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const t = graph.get<Term>("term", (await params).id);
  if (!t) return { title: "Not found" };
  return { title: `${t.name}`, description: t.one_line };
}

export default async function TermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = graph.get<Term>("term", id);
  if (!term) notFound();

  const L = createLinker(`term:${term.id}`);

  // see_also is authored as bare slugs, so resolve against any node type.
  const seeAlso = term.see_also
    .map((slug) =>
      ["term", "concept", "heuristic", "framework", "question_type", "company_lens"]
        .map((t) => byKey.get(`${t}:${slug}`))
        .find(Boolean)
    )
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <main className="mx-auto max-w-[720px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav crumb={{ label: "Glossary", href: "/glossary" as Route }} />

      <header className="mb-7">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-400">
            {term.domain}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-600">term</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-100">{term.name}</h1>
        {term.aka.length > 0 && (
          <p className="mt-1 font-mono text-[11px] text-ink-400">also: {term.aka.join(" · ")}</p>
        )}
        <p className="mt-3 text-lg leading-relaxed text-ink-300">{L(term.one_line)}</p>
      </header>

      <div className="space-y-7">
        <p className="text-[15px] leading-relaxed text-ink-300">{L(term.definition)}</p>

        {term.formula && (
          <code className="block overflow-x-auto rounded-lg border border-ink-800 bg-ink-900/60 px-3 py-2.5 font-mono text-[13px] text-live-400">
            {term.formula}
          </code>
        )}

        {term.watch_out && (
          <div className="rounded-lg border border-warn-400/25 bg-warn-400/[0.04] p-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-warn-400">
              Watch out
            </div>
            <p className="text-[14px] leading-relaxed text-ink-300">{L(term.watch_out)}</p>
          </div>
        )}

        {seeAlso.length > 0 && (
          <Section title="See also">
            <div className="flex flex-wrap gap-2">
              {seeAlso.map((s) => (
                <Link
                  key={s.key}
                  href={s.href as Route}
                  className="rounded-lg border border-ink-800 bg-ink-900/70 px-3 py-2 text-[13px] text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </Section>
        )}

        <Backlinks type="term" id={term.id} />
      </div>
    </main>
  );
}
