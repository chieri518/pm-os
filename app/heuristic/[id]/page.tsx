import Link from "next/link";
import { notFound } from "next/navigation";
import { graph } from "@/src/graph/bundle";
import { describe } from "@/src/graph/predicate";
import type { Heuristic } from "@/src/schema/nodes";
import { Backlinks } from "@/app/backlinks";
import { createLinker } from "@/app/linked";
import { Nav } from "../../nav";
import { EvidenceTag } from "../../ui";
import { Prose, Quote, Section, WorkedExampleCards } from "../../teaching";

export function generateStaticParams() {
  return graph.heuristics().map((h) => ({ id: h.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const h = graph.get<Heuristic>("heuristic", (await params).id);
  if (!h) return { title: "Not found · pm-os" };
  return { title: `${h.name} · pm-os`, description: h.teaching?.in_one_line ?? h.claim };
}

export default async function HeuristicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = graph.get<Heuristic>("heuristic", id);
  if (!h) notFound();

  const L = createLinker(`heuristic:${h.id}`);

  const t = h.teaching;
  const surfaces = graph.surfacesAt(h.id);
  const tensions = graph
    .edgesFrom({ type: "heuristic", id: h.id }, "TENSIONS_WITH")
    .map((edge) => {
      const other = graph.otherEnd(edge, { type: "heuristic", id: h.id });
      return { edge, other: graph.get<Heuristic>("heuristic", other.id) };
    })
    .filter((x): x is { edge: (typeof x)["edge"]; other: Heuristic } => Boolean(x.other));

  return (
    <main className="mx-auto max-w-[820px] px-6 py-8">
      <Nav crumb={{ label: h.name }} />

      <header className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <EvidenceTag strength={h.evidence_strength} />
          <span className="rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-400">
            {h.scope}
          </span>
          {h.aka.map((a) => (
            <span key={a} className="font-mono text-[10px] text-ink-400">
              aka {a}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-100">{h.name}</h1>
        {t && <p className="mt-3 text-lg leading-relaxed text-ink-300">{t.in_one_line}</p>}
        {h.source && (
          <p className="mt-3 font-mono text-[11px] text-ink-400">{h.source.label}</p>
        )}
      </header>

      {!t && (
        <p className="rounded-xl border border-ink-800 bg-ink-900 p-4 text-sm text-ink-400">
          Teaching content for this concept has not been written yet.
        </p>
      )}

      {t && (
        <div className="space-y-8">
          <Section title="The mechanism" note="Why it works — which is what tells you when it doesn't.">
            <Prose>{L(t.mechanism)}</Prose>
          </Section>

          <Section title="In an interview">
            <Prose className="mb-4">{t.in_interview.how_to_deploy}</Prose>
            <div className="space-y-3">
              <Quote tone="strong" label="Strong sounds like">
                {t.in_interview.strong_sounds_like}
              </Quote>
              <Quote tone="weak" label="Weak sounds like">
                {t.in_interview.weak_sounds_like}
              </Quote>
            </div>
            {surfaces.length > 0 && (
              <div className="mt-4 rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                  Deploy at
                </div>
                <ul className="space-y-2">
                  {surfaces.map(({ part, edge }) => (
                    <li key={part.id} className="text-[13px] leading-relaxed">
                      <span className="font-medium text-ink-100">{part.name}</span>
                      <span className="text-ink-400"> — {edge.rationale}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section title="In product work">
            <Prose>{L(t.in_product_work)}</Prose>
          </Section>

          <Section title="In daily life" note="The retrieval hook — what you'll actually recall under pressure.">
            <Prose>{L(t.in_daily_life)}</Prose>
          </Section>

          <Section title="Worked example">
            <WorkedExampleCards example={t.worked_example} />
          </Section>
        </div>
      )}

      <div className="mt-8 space-y-8">
        {(h.caveat || h.common_misapplication) && (
          <Section title="Where the evidence stops" tone="warn">
            {h.caveat && <Prose className="mb-3">{L(h.caveat)}</Prose>}
            {h.common_misapplication && (
              <div className="rounded-lg border border-warn-400/25 bg-warn-400/[0.04] p-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-warn-400">
                  Common misapplication
                </div>
                <Prose>{L(h.common_misapplication)}</Prose>
              </div>
            )}
          </Section>
        )}

        {tensions.length > 0 && (
          <Section title="Conflicts with" note="Pairs you may have to resolve out loud.">
            <div className="space-y-3">
              {tensions.map(({ edge, other }) => (
                <div
                  key={other.id}
                  className="rounded-lg border border-tension-400/25 bg-tension-400/[0.04] p-3"
                >
                  <Link
                    href={`/heuristic/${other.id}`}
                    className="text-[15px] font-medium text-ink-100 underline decoration-tension-400/40 underline-offset-4 hover:decoration-tension-400"
                  >
                    {other.name}
                  </Link>
                  <Prose className="mt-1.5">{edge.rationale}</Prose>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="When it fires">
          <p className="font-mono text-[12px] leading-relaxed text-ink-300">
            {h.scope === "experience"
              ? describe(h.applies_when)
              : "Decision-scope — this acts on your reasoning, not on the user's situation, so it is always available."}
          </p>
          {h.scope === "experience" && (
            <p className="mt-3 text-[13px] text-ink-400">
              See this fire against a real user context in a{" "}
              <Link
                href="/practice"
                className="text-ink-100 underline decoration-ink-600 underline-offset-4 hover:decoration-ink-400"
              >
                practice session
              </Link>
              .
            </p>
          )}
        </Section>
        <Backlinks type="heuristic" id={h.id} />
      </div>
    </main>
  );
}
