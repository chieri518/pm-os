import Link from "next/link";
import { notFound } from "next/navigation";
import { graph } from "@/src/graph/bundle";
import type { Framework, QuestionType } from "@/src/schema/nodes";
import type { FrameworkPart } from "@/src/graph/index";
import { Backlinks } from "@/app/backlinks";
import { createLinker } from "@/app/linked";
import { Nav } from "../../nav";
import { MistakeList, Prose, Section } from "../../teaching";

export function generateStaticParams() {
  return graph.frameworks().map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const f = graph.get<Framework>("framework", (await params).id);
  if (!f) return { title: "Not found · pm-os" };
  return { title: `${f.name} · pm-os`, description: f.teaching?.in_one_line ?? f.summary };
}

/**
 * Parts live under a kind-specific key on each framework variant. Flattening to
 * one optional-field shape keeps the renderer simple — narrowing a union of
 * ARRAYS (rather than a union of objects) does not survive `.map`, so the
 * presence checks below are on values rather than on keys.
 */
type DisplayPart = {
  id: string;
  name: string;
  prompt: string;
  order?: number;
  expected_duration_pct?: number;
  key_questions?: string[];
  example_metrics?: string[];
  scale?: string;
};

function partsOf(f: Framework): DisplayPart[] {
  switch (f.kind) {
    case "procedural":
      return f.stages;
    case "narrative":
      return f.beats;
    case "taxonomic":
      return f.dimensions;
    case "calculative":
      return f.factors;
  }
}

const KIND_NOTE: Record<Framework["kind"], string> = {
  procedural: "Ordered stages with a time budget — the order is the value.",
  narrative: "Ordered beats for telling a story. No time budget; proportion matters instead.",
  taxonomic: "A classification, not a sequence. Use it to find the relevant box, not to recite all of them.",
  calculative: "Inputs that combine into a score. The score is an input to a decision, not the decision.",
};

export default async function FrameworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = graph.get<Framework>("framework", id);
  if (!f) notFound();

  const L = createLinker(`framework:${f.id}`);

  const t = f.teaching;
  const parts = partsOf(f);

  // Which question types point here, so the page closes the loop back to the entry point.
  const askedFrom = graph
    .edgesTo({ type: "framework", id: f.id }, "ANSWERED_WITH")
    .map((edge) => ({ edge, q: graph.get<QuestionType>("question_type", edge.from.id) }))
    .filter((r): r is { edge: (typeof r)["edge"]; q: QuestionType } => Boolean(r.q))
    .sort((a, b) => b.edge.strength - a.edge.strength);

  // Heuristics that attach to any part of this framework.
  const attached = graph
    .heuristics()
    .flatMap((h) =>
      graph
        .surfacesAt(h.id)
        .filter((s) => s.part.framework_id === f.id)
        .map((s) => ({ h, part: s.part, edge: s.edge }))
    );

  const partName = (pid: string) =>
    graph.get<FrameworkPart>("framework_part", pid)?.name ?? pid;

  return (
    <main className="mx-auto max-w-[860px] px-6 py-8">
      <Nav crumb={{ label: f.name }} />

      <header className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-400">
            {f.kind}
          </span>
          {f.aka.map((a) => (
            <span key={a} className="font-mono text-[10px] text-ink-400">
              aka {a}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-100">{f.name}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-300">
          {t?.in_one_line ?? f.summary}
        </p>
        <p className="mt-2 text-[13px] text-ink-400">{KIND_NOTE[f.kind]}</p>
        {f.source && <p className="mt-3 font-mono text-[11px] text-ink-400">{f.source.label}</p>}
      </header>

      <div className="space-y-8">
        <Section title={f.kind === "procedural" ? "The stages" : "The parts"}>
          <ol className="space-y-2">
            {parts.map((p, i) => (
              <li
                key={p.id}
                className="flex gap-3 rounded-lg border border-ink-800 bg-ink-900/60 p-3"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-ink-700 bg-ink-850 font-mono text-[11px] text-ink-300">
                  {p.order ?? i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink-100">{p.name}</span>
                    {p.expected_duration_pct !== undefined && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                        {p.expected_duration_pct}% of answer time
                      </span>
                    )}
                    {p.scale && (
                      <span className="font-mono text-[10px] text-ink-400">{p.scale}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-ink-300">{p.prompt}</p>
                  {p.key_questions && p.key_questions.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {p.key_questions.map((k: string) => (
                        <li key={k} className="text-[13px] text-ink-400">
                          <span className="text-ink-600">·</span> {k}
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.example_metrics && p.example_metrics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.example_metrics.map((m: string) => (
                        <span
                          key={m}
                          className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-ink-400"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {t && (
          <>
            <Section title="Why this structure" note="The decomposition is the argument.">
              <Prose>{L(t.why_this_structure)}</Prose>
            </Section>

            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="Use it when">
                <ul className="space-y-1.5">
                  {t.when_to_use.map((w) => (
                    <li key={w} className="flex gap-2 text-[14px] leading-relaxed text-ink-300">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-live-400" />
                      {w}
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Do not use it when" tone="warn">
                <ul className="space-y-1.5">
                  {t.when_not_to_use.map((w) => (
                    <li key={w} className="flex gap-2 text-[14px] leading-relaxed text-ink-300">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-warn-400" />
                      {w}
                    </li>
                  ))}
                </ul>
              </Section>
            </div>

            <Section title="Worked walkthrough" note="What it actually sounds like, beat by beat.">
              <p className="mb-3 rounded-lg border border-ink-800 bg-ink-850/60 p-3 text-[15px] text-ink-100">
                {t.worked_walkthrough.question}
              </p>
              <div className="space-y-2.5">
                {t.worked_walkthrough.beats.map((b) => (
                  <div key={b.part_id} className="border-l-2 border-ink-700 pl-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      {partName(b.part_id)}
                    </div>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-ink-300">
                      &ldquo;{b.say}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Failure modes" tone="warn">
              <MistakeList items={t.failure_modes} />
            </Section>
          </>
        )}

        {!t && (
          <p className="rounded-xl border border-ink-800 bg-ink-900 p-4 text-sm text-ink-400">
            Teaching content for this framework has not been written yet.
          </p>
        )}

        {askedFrom.length > 0 && (
          <Section title="Questions this answers">
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
                      fit {edge.strength}/5
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-300">{edge.rationale}</p>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {attached.length > 0 && (
          <Section title="Heuristics that land here" note="Deploy these at the stage shown.">
            <div className="space-y-2">
              {attached.map(({ h, part, edge }) => (
                <div key={`${h.id}-${part.id}`} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Link
                      href={`/heuristic/${h.id}`}
                      className="text-[15px] font-medium text-ink-100 underline decoration-ink-600 underline-offset-4 hover:decoration-ink-400"
                    >
                      {h.name}
                    </Link>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      at {part.name}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-300">{edge.rationale}</p>
                </div>
              ))}
            </div>
          </Section>
        )}
        <Backlinks type="framework" id={f.id} />
      </div>
    </main>
  );
}
