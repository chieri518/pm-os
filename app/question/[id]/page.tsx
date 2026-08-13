import Link from "next/link";
import { notFound } from "next/navigation";
import { graph } from "@/src/graph/bundle";
import type { CompanyLens, Concept, Framework, QuestionType } from "@/src/schema/nodes";
import { Backlinks } from "@/app/backlinks";
import { createLinker } from "@/app/linked";
import { Nav } from "../../nav";
import { MistakeList, Prose, Quote, Section, WorkedExampleCards } from "../../teaching";

export function generateStaticParams() {
  return graph.questionTypes().map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const q = graph.get<QuestionType>("question_type", (await params).id);
  if (!q) return { title: "Not found · pm-os" };
  return { title: `${q.name} questions · pm-os`, description: q.teaching?.in_one_line };
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = graph.get<QuestionType>("question_type", id);
  if (!q) notFound();

  const L = createLinker(`question_type:${q.id}`);

  const t = q.teaching;
  const ref = { type: "question_type" as const, id: q.id };

  const frameworks = graph
    .edgesFrom(ref, "ANSWERED_WITH")
    .map((edge) => ({ edge, node: graph.get<Framework>("framework", edge.to.id) }))
    .filter((r): r is { edge: (typeof r)["edge"]; node: Framework } => Boolean(r.node))
    .sort((a, b) => b.edge.strength - a.edge.strength);

  const concepts = graph
    .edgesFrom(ref, "REQUIRES")
    .map((edge) => ({ edge, node: graph.get<Concept>("concept", edge.to.id) }))
    .filter((r): r is { edge: (typeof r)["edge"]; node: Concept } => Boolean(r.node))
    .sort((a, b) => b.edge.strength - a.edge.strength);

  const lenses = graph
    .edgesFrom(ref, "ASKED_BY")
    .map((edge) => ({ edge, node: graph.get<CompanyLens>("company_lens", edge.to.id) }))
    .filter((r): r is { edge: (typeof r)["edge"]; node: CompanyLens } => Boolean(r.node))
    .sort((a, b) => b.edge.strength - a.edge.strength);

  return (
    <main className="mx-auto max-w-[860px] px-6 py-8">
      <Nav crumb={{ label: q.name }} />

      <header className="mb-8">
        <span className="rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-400">
          {q.family}
        </span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-100">{q.name}</h1>
        {t && <p className="mt-3 text-lg leading-relaxed text-ink-300">{t.in_one_line}</p>}
      </header>

      <div className="space-y-8">
        <Section title="You'll hear it as">
          <ul className="space-y-1.5">
            {q.prompt_forms.map((p) => (
              <li key={p} className="text-[15px] text-ink-300">
                <span className="text-ink-600">&ldquo;</span>
                {p}
                <span className="text-ink-600">&rdquo;</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="What is actually being scored">
          <ul className="space-y-1.5">
            {q.what_is_tested.map((w) => (
              <li key={w} className="flex gap-2 text-[15px] leading-relaxed text-ink-300">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-live-400" />
                {w}
              </li>
            ))}
          </ul>
        </Section>

        {t && (
          <Section title="Why they ask it" note="The mechanism — what this question reveals that others don't.">
            <Prose>{t.mechanism}</Prose>
          </Section>
        )}

        <Section title="The approach" note={q.time_guidance ? undefined : "Signpost each transition out loud."}>
          <ol className="space-y-3">
            {q.approach.map((s) => (
              <li key={s.step} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-ink-700 bg-ink-850 font-mono text-[11px] text-ink-300">
                  {s.step}
                </span>
                <div>
                  <div className="text-[15px] font-medium text-ink-100">{s.title}</div>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-ink-300">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          {q.time_guidance && (
            <div className="mt-4 rounded-lg border border-ink-800 bg-ink-900/60 p-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                Time guidance
              </div>
              <Prose>{L(q.time_guidance)}</Prose>
            </div>
          )}
        </Section>

        {t && (
          <Section title="What good sounds like">
            <Prose className="mb-4">{t.in_interview.how_to_deploy}</Prose>
            <div className="space-y-3">
              <Quote tone="strong" label="Strong sounds like">
                {t.in_interview.strong_sounds_like}
              </Quote>
              <Quote tone="weak" label="Weak sounds like">
                {t.in_interview.weak_sounds_like}
              </Quote>
            </div>
          </Section>
        )}

        <Section title="Pitfalls" tone="warn" note="Ranked by how often they cost candidates the loop.">
          <MistakeList items={q.pitfalls} />
        </Section>

        {concepts.length > 0 && (
          <Section
            title="Assumed knowledge"
            note="Subjects you are expected to already have. Not taught in the room."
          >
            <div className="space-y-2.5">
              {concepts.map(({ edge, node }) => (
                <Link
                  key={node.id}
                  href={`/concept/${node.id}`}
                  className="block rounded-lg border border-ink-800 bg-ink-900/70 p-3 transition-colors hover:border-ink-600 hover:bg-ink-850"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink-100">{node.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      {node.domain} · {edge.strength}/5
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-300">{edge.rationale}</p>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {frameworks.length > 0 && (
          <Section title="Reach for" note="Structures that fit this question, strongest first.">
            <div className="space-y-2.5">
              {frameworks.map(({ edge, node }) => (
                <Link
                  key={node.id}
                  href={`/framework/${node.id}`}
                  className="block rounded-lg border border-ink-800 bg-ink-900/70 p-3 transition-colors hover:border-ink-600 hover:bg-ink-850"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink-100">{node.name}</span>
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

        {lenses.length > 0 && (
          <Section title="Where it carries most weight">
            <div className="space-y-2.5">
              {lenses.map(({ edge, node }) => (
                <div key={node.id} className="rounded-lg border border-ink-800 bg-ink-900/70 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink-100">{node.company}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      {edge.strength}/5
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-300">{edge.rationale}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {t && (
          <>
            <Section title="In product work">
              <Prose>{t.in_product_work}</Prose>
            </Section>
            <Section title="In daily life" note="The retrieval hook.">
              <Prose>{t.in_daily_life}</Prose>
            </Section>
            <Section title="Worked example">
              <WorkedExampleCards example={t.worked_example} />
            </Section>
          </>
        )}

        <Section title="Practice questions">
          <ul className="space-y-1.5">
            {q.sample_questions.map((s) => (
              <li key={s} className="text-[15px] text-ink-300">
                <span className="text-ink-600">·</span> {s}
              </li>
            ))}
          </ul>
        </Section>
        <Backlinks type="question_type" id={q.id} />
      </div>
    </main>
  );
}
