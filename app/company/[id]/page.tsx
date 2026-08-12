import Link from "next/link";
import { notFound } from "next/navigation";
import { graph } from "@/src/graph/bundle";
import type { CompanyLens, LensSource, LoopStage } from "@/src/schema/nodes";
import type { FrameworkPart } from "@/src/graph/index";
import { Nav } from "../../nav";
import { Prose, Section } from "../../teaching";

export function generateStaticParams() {
  return graph.lenses().map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const l = graph.get<CompanyLens>("company_lens", (await params).id);
  if (!l) return { title: "Not found · pm-os" };
  return {
    title: `${l.company} · pm-os`,
    description: `How ${l.company} runs its PM loop, what it evaluates, and where common prep advice is wrong.`,
  };
}

/**
 * Provenance is rendered, not hidden. A reader should be able to see at a glance
 * that Amazon's Leadership Principles are quoted from Amazon and that the stage
 * weightings are our inference — those are different kinds of claim and the old
 * blanket "researched estimates" label made them look identical.
 */
const TIER: Record<LensSource["tier"], { label: string; cls: string; blurb: string }> = {
  official: {
    label: "official",
    cls: "border-live-600/40 bg-live-600/10 text-live-400",
    blurb: "Published by the company itself.",
  },
  corroborated: {
    label: "corroborated",
    cls: "border-ink-600 bg-ink-800 text-ink-300",
    blurb: "Consistently reported across independent accounts. Not first-party.",
  },
  estimate: {
    label: "our estimate",
    cls: "border-warn-400/40 bg-warn-400/10 text-warn-400",
    blurb: "Our inference. Explicitly not fact.",
  },
};

function TierTag({ tier }: { tier: LensSource["tier"] }) {
  const t = TIER[tier];
  return (
    <span
      className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${t.cls}`}
    >
      {t.label}
    </span>
  );
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lens = graph.get<CompanyLens>("company_lens", id);
  if (!lens) notFound();

  const stages = graph.weightedParts(lens.id, "circles");
  const maxWeight = Math.max(...stages.map((s) => s.weight), 1);

  return (
    <main className="mx-auto max-w-[880px] px-6 py-8">
      <Nav crumb={{ label: lens.company }} />

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-100">{lens.company}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">{lens.philosophy}</p>
      </header>

      <div className="space-y-8">
        {lens.myths.length > 0 && (
          <Section
            title="Where common advice is wrong"
            note="Prep folklore checked against what the company actually publishes."
            tone="warn"
          >
            <div className="space-y-3">
              {lens.myths.map((m) => (
                <div key={m.common_advice} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-[14px] leading-relaxed text-ink-400 line-through decoration-warn-400/40">
                      {m.common_advice}
                    </p>
                    <TierTag tier={m.source_tier} />
                  </div>
                  <p className="text-[14px] leading-relaxed text-ink-100">{m.reality}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {lens.loop.length > 0 && (
          <Section title="The loop" note="What each stage is for.">
            <ol className="space-y-2.5">
              {lens.loop.map((s: LoopStage, i) => (
                <li key={s.stage} className="flex gap-3">
                  <span className="mt-1 w-5 shrink-0 text-right font-mono text-[11px] text-ink-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-[15px] font-medium text-ink-100">{s.stage}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                        {s.format}
                        {s.duration_min ? ` · ${s.duration_min}m` : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink-300">{s.tests}</p>
                    {s.note && (
                      <p className="mt-1.5 border-l-2 border-ink-700 pl-2.5 text-[13px] leading-relaxed text-ink-400">
                        {s.note}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {lens.values.length > 0 && (
          <Section
            title={lens.values_label ?? "What they evaluate"}
            note="Their vocabulary, not ours."
          >
            <div className="space-y-2">
              {lens.values.map((v) => (
                <div key={v.name} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                  <div className="text-[14px] font-medium text-ink-100">{v.name}</div>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-300">{v.description}</p>
                  {v.in_answers && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-live-400/90">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                        in answers ·{" "}
                      </span>
                      {v.in_answers}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {stages.length > 0 && (
          <Section
            title="Where this lens spends its points"
            note="Across the CIRCLES stages. These weightings are our estimate, not published."
          >
            <div className="space-y-1.5">
              {stages.map(({ part, weight, edge }: { part: FrameworkPart; weight: number; edge: { rationale: string } }) => (
                <div key={part.id} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-ink-100">
                      {weight}%
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full bg-ink-400"
                        style={{ width: `${(weight / maxWeight) * 100}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[14px] text-ink-100">{part.name}</span>
                  </div>
                  <p className="mt-1.5 pl-12 text-[13px] leading-relaxed text-ink-400">
                    {edge.rationale}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Scored dimensions">
          <div className="space-y-2">
            {lens.rubric.map((r) => (
              <div key={r.id} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] font-medium text-ink-100">{r.name}</span>
                  <span className="font-mono text-[11px] tabular-nums text-ink-400">{r.weight}%</span>
                </div>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-300">{r.description}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-live-400/90">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                    strong ·{" "}
                  </span>
                  {r.strong_signal}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {lens.red_flags.length > 0 && (
          <Section title="Red flags" tone="warn">
            <ul className="space-y-1.5">
              {lens.red_flags.map((f) => (
                <li key={f} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-300">
                  <span className="mt-0.5 shrink-0 text-warn-400">✕</span>
                  {f}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {lens.sample_questions.length > 0 && (
          <Section title="Questions in this style">
            <ul className="space-y-1.5">
              {lens.sample_questions.map((q) => (
                <li
                  key={q}
                  className="rounded-lg border border-ink-800 bg-ink-850/50 px-3 py-2 text-[14px] leading-relaxed text-ink-300"
                >
                  {q}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <Link
                href="/practice"
                className="text-[13px] text-live-400 underline-offset-2 hover:underline"
              >
                Practise one against this lens →
              </Link>
            </p>
          </Section>
        )}

        <Section title="Sources" note="Every claim above, graded by where it came from.">
          <ul className="space-y-2">
            {lens.sources.map((s) => (
              <li
                key={s.label}
                className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/60 p-3"
              >
                <TierTag tier={s.tier} />
                <span className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-300">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-ink-600 underline-offset-2 hover:text-ink-100"
                    >
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                  {s.year && <span className="text-ink-400"> ({s.year})</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-ink-800 pt-3">
            {(["official", "corroborated", "estimate"] as const).map((t) => (
              <p key={t} className="flex items-baseline gap-2 font-mono text-[10px] text-ink-400">
                <TierTag tier={t} />
                {TIER[t].blurb}
              </p>
            ))}
          </div>
        </Section>

        <Prose className="border-t border-ink-800 pt-4 !text-[12px] !text-ink-400">
          Not affiliated with, sponsored by, or endorsed by {lens.company}. Trademarks belong to
          their owners. See NOTICE.md.
        </Prose>
      </div>
    </main>
  );
}
