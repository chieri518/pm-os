import Link from "next/link";
import { notFound } from "next/navigation";
import { graph } from "@/src/graph/bundle";
import type { Concept, QuestionType } from "@/src/schema/nodes";
import { Backlinks } from "@/app/backlinks";
import { createLinker } from "@/app/linked";
import { Nav } from "../../nav";
import { EvidenceTag } from "../../ui";
import { MistakeList, Prose, Quote, Section } from "../../teaching";

export function generateStaticParams() {
  return graph.concepts().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const c = graph.get<Concept>("concept", (await params).id);
  if (!c) return { title: "Not found · pm-os" };
  return { title: `${c.name} · pm-os`, description: c.in_one_line };
}

/** Progressive depth. Read top to bottom and the subject gets harder on purpose. */
const LEVEL_META: Record<string, { label: string; note: string; accent: string }> = {
  orientation: {
    label: "1 · Orientation",
    note: "What it is and why anyone cares.",
    accent: "border-ink-600",
  },
  working: {
    label: "2 · Working knowledge",
    note: "How to actually use it — mechanics and numbers.",
    accent: "border-live-600/50",
  },
  expert: {
    label: "3 · Where it breaks",
    note: "The arguments, the limits, and what a follow-up will probe.",
    accent: "border-warn-400/50",
  },
};

export default async function ConceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = graph.get<Concept>("concept", id);
  if (!c) notFound();

  const L = createLinker(`concept:${c.id}`);

  const askedFrom = graph
    .edgesTo({ type: "concept", id: c.id }, "REQUIRES")
    .map((edge) => ({ edge, q: graph.get<QuestionType>("question_type", edge.from.id) }))
    .filter((r): r is { edge: (typeof r)["edge"]; q: QuestionType } => Boolean(r.q))
    .sort((a, b) => b.edge.strength - a.edge.strength);

  return (
    <main className="mx-auto max-w-[860px] px-6 py-8">
      <Nav crumb={{ label: c.name }} />

      <header className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-400">
            {c.domain}
          </span>
          <EvidenceTag strength={c.evidence.strength} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-100">{c.name}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-300">{c.in_one_line}</p>
      </header>

      <div className="space-y-8">
        <Section title="Why it matters">
          <Prose>{L(c.why_it_matters)}</Prose>
        </Section>

        {/* ---------------------------------------------- progressive depth */}
        <section>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">
              The concept, in three depths
            </h2>
            <span className="text-xs text-ink-400">
              Read top to bottom. It gets harder on purpose.
            </span>
          </div>
          <div className="space-y-4">
            {c.layers.map((layer) => {
              const meta = LEVEL_META[layer.level]!;
              return (
                <div key={layer.level} className={`border-l-2 pl-4 ${meta.accent}`}>
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-ink-600">{meta.note}</span>
                  </div>
                  <h3 className="text-[16px] font-medium text-ink-100">{layer.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-300">{L(layer.body)}</p>
                </div>
              );
            })}
          </div>
        </section>

        {c.formulas.length > 0 && (
          <Section title="The maths" note="Know these cold; they come up as follow-ups.">
            <div className="space-y-2">
              {c.formulas.map((f) => (
                <div key={f.name} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                  <div className="text-[14px] font-medium text-ink-100">{f.name}</div>
                  <code className="mt-1 block overflow-x-auto rounded bg-ink-850 px-2 py-1.5 font-mono text-[12.5px] text-live-400">
                    {f.expression}
                  </code>
                  {f.notes && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">{f.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Worked example">
          <p className="mb-3 rounded-lg border border-ink-800 bg-ink-850/60 p-3 text-[15px] text-ink-100">
            {c.worked_example.situation}
          </p>
          <ol className="space-y-1.5">
            {c.worked_example.steps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="mt-0.5 w-5 shrink-0 text-right font-mono text-[11px] text-ink-600">
                  {i + 1}
                </span>
                <span className="text-[14px] leading-relaxed text-ink-300">{L(s)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-l-2 border-ink-600 pl-3 text-[15px] leading-relaxed text-ink-100">
            {L(c.worked_example.takeaway)}
          </p>
        </Section>

        <Section title="In an interview">
          <Prose className="mb-4">{L(c.in_interview.how_to_deploy)}</Prose>
          <div className="space-y-3">
            <Quote tone="strong" label="Strong sounds like">
              {c.in_interview.strong_sounds_like}
            </Quote>
            <Quote tone="weak" label="Weak sounds like">
              {c.in_interview.weak_sounds_like}
            </Quote>
          </div>
        </Section>

        <Section title="Common errors" tone="warn">
          <MistakeList items={c.common_errors} />
        </Section>

        <Section title="How solid is this?" note="The evidence verdict, not a vibe.">
          <div className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
            <div className="mb-1.5">
              <EvidenceTag strength={c.evidence.strength} />
            </div>
            <Prose>{L(c.evidence.note)}</Prose>
            {c.sources.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-ink-800 pt-3">
                {c.sources.map((s) => (
                  <li key={s.label} className="font-mono text-[11px] leading-relaxed text-ink-400">
                    {s.label}
                    {s.year && <> ({s.year})</>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        {askedFrom.length > 0 && (
          <Section title="Where you'll need it">
            <div className="space-y-2.5">
              {askedFrom.map(({ edge, q }) => (
                <Link
                  key={q.id}
                  href={`/question/${q.id}`}
                  className="block rounded-lg border border-ink-800 bg-ink-900/70 p-3 transition-colors hover:border-ink-600 hover:bg-ink-850"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink-100">{q.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      {edge.strength}/5
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-300">{edge.rationale}</p>
                </Link>
              ))}
            </div>
          </Section>
        )}
      <Backlinks type="concept" id={c.id} />
      </div>
    </main>
  );
}
