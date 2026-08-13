import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { graph } from "@/src/graph/bundle";
import type { InterviewGuide, QuestionType } from "@/src/schema/nodes";
import { Nav } from "../../nav";
import { Section } from "../../teaching";
import { createLinker } from "../../linked";
import { SignalChecklist } from "../checklist";

const COMPETENCIES = [
  { id: "ambiguity-scoping", label: "Ambiguity & scoping" },
  { id: "segmentation", label: "Segmentation" },
  { id: "jtbd-pain-points", label: "Jobs & pain points" },
  { id: "prioritisation-tradeoffs", label: "Prioritisation & trade-offs" },
  { id: "metrics-guardrails", label: "Metrics & guardrails" },
] as const;

const qtName = (id: string) =>
  graph.get<QuestionType>("question_type", id)?.name ?? id;

export function generateStaticParams() {
  return graph.guides().map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const g = graph.get<InterviewGuide>("interview_guide", (await params).id);
  if (!g) return { title: "Not found" };
  return { title: `${qtName(g.question_type)} interviewer guide`, description: g.intent.slice(0, 155) };
}

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = graph.get<InterviewGuide>("interview_guide", id);
  if (!g) notFound();

  const L = createLinker(`interview_guide:${g.id}`);
  const qt = graph.get<QuestionType>("question_type", g.question_type);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav crumb={{ label: "Interviewer guides", href: "/interviewer" as Route }} />

      <p className="mb-4 text-[13px] text-ink-400">
        New to running these?{" "}
        <Link
          href={"/interviewer/running-a-session" as Route}
          className="text-live-400 underline-offset-2 hover:underline"
        >
          Read how a session is structured first →
        </Link>
      </p>

      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {qt && (
            <Link
              href={`/question/${qt.id}` as Route}
              className="rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-300 hover:text-ink-100"
            >
              {qt.name}
            </Link>
          )}
          <span className="rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-400">
            {g.difficulty}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
            {g.duration_min} min
          </span>
        </div>
        <h1 className="max-w-3xl text-[26px] font-semibold leading-tight tracking-tight text-ink-100">
          {g.question}
        </h1>
        {g.variants.length > 0 && (
          <p className="mt-2 text-[13px] text-ink-400">
            Same shape: {g.variants.join(" · ")}
          </p>
        )}
      </header>

      {/* Provenance up front, not in a footnote. These guides are constructed. */}
      <div className="mb-7 rounded-lg border border-warn-400/25 bg-warn-400/[0.04] p-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded border border-warn-400/40 bg-warn-400/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-warn-400">
            constructed
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
            not an internal document
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-300">{L(g.basis)}</p>
      </div>

      <div className="mb-7 rounded-lg border border-ink-800 bg-ink-900/60 p-3">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-400">
          Competencies this question exercises
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMPETENCIES.map(({ id: cid, label }) => {
            const tier = g.competencies.core.includes(cid)
              ? "core"
              : g.competencies.light.includes(cid)
                ? "light"
                : "none";
            return (
              <span
                key={cid}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] ${
                  tier === "core"
                    ? "border-live-600/40 bg-live-600/10 text-live-400"
                    : tier === "light"
                      ? "border-ink-600 bg-ink-850 text-ink-300"
                      : "border-ink-800 bg-ink-900 text-ink-600 line-through decoration-ink-700"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink-400">
          Struck through means this question will not show it to you — run a second question that does.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-7">
          <Section title="What this question is for">
            <p className="text-[15px] leading-relaxed text-ink-300">{L(g.intent)}</p>
          </Section>

          <Section title="Delivering it">
            <p className="text-[15px] leading-relaxed text-ink-300">{L(g.delivery.script)}</p>
            {g.delivery.setup.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {g.delivery.setup.map((s) => (
                  <li key={s} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-400">
                    <span className="mt-0.5 shrink-0 text-ink-600">□</span>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {g.clarifying.length > 0 && (
            <Section
              title="If they ask"
              note="What to grant, what to hand back. Keep it identical across candidates."
            >
              <div className="space-y-2.5">
                {g.clarifying.map((c) => (
                  <div key={c.asks} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                    <div className="text-[14px] font-medium text-ink-100">“{c.asks}”</div>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-300">{L(c.answer)}</p>
                    {c.why && (
                      <p className="mt-1.5 border-l-2 border-ink-700 pl-2.5 text-[12.5px] leading-relaxed text-ink-400">
                        {L(c.why)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {g.checkpoints.length > 0 && (
            <Section title="Pacing" note="Where they should be, and when.">
              <ol className="relative space-y-2 border-l border-ink-800 pl-5">
                {g.checkpoints.map((c) => (
                  <li key={c.at_min} className="relative">
                    <span className="absolute -left-[23px] top-1 size-1.5 rounded-full bg-ink-600" />
                    <span className="font-mono text-[11px] tabular-nums text-live-400">
                      {c.at_min}m
                    </span>
                    <span className="ml-2 text-[14px] leading-relaxed text-ink-300">{c.expect}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          <Section title="Probe ladder" note="Hold these in reserve. Escalate depth, don't lead.">
            <div className="space-y-2.5">
              {g.probes.map((p) => (
                <div key={p.ask} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                    when · {p.trigger}
                  </div>
                  <div className="mt-1 text-[14.5px] font-medium leading-snug text-ink-100">
                    “{p.ask}”
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-live-400/90">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      looking for ·{" "}
                    </span>
                    {L(p.looking_for)}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {g.rescues.length > 0 && (
            <Section
              title="Unsticking without giving it away"
              note="The hold-back line is the part that keeps the signal intact."
            >
              <div className="space-y-2.5">
                {g.rescues.map((r) => (
                  <div key={r.when} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      when · {r.when}
                    </div>
                    <div className="mt-1 text-[14px] text-ink-100">{r.offer}</div>
                    <p className="mt-1.5 border-l-2 border-warn-400/40 pl-2.5 text-[12.5px] leading-relaxed text-ink-400">
                      Hold back: {L(r.hold_back)}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section
            title="Debrief"
            note="Last five minutes. Specific beats kind — they can act on specific."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-live-600/30 bg-live-600/[0.05] p-3">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-live-400">
                  Plus
                </div>
                <ul className="space-y-1.5">
                  {g.debrief.plus.map((x) => (
                    <li key={x} className="text-[13.5px] leading-relaxed text-ink-300">
                      “{x}”
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-warn-400/30 bg-warn-400/[0.04] p-3">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-warn-400">
                  Delta
                </div>
                <ul className="space-y-1.5">
                  {g.debrief.delta.map((x) => (
                    <li key={x} className="text-[13.5px] leading-relaxed text-ink-300">
                      “{x}”
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-3 border-l-2 border-ink-600 pl-3 text-[14px] leading-relaxed text-ink-100">
              {L(g.debrief.most_common)}
            </p>
          </Section>

          <Section title="What not to score on" tone="warn">
            <ul className="space-y-2">
              {g.bias_guards.map((b) => (
                <li key={b} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-300">
                  <span className="mt-0.5 shrink-0 text-warn-400">!</span>
                  {L(b)}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SignalChecklist groups={g.signal_groups} antiSignals={g.anti_signals} />
        </aside>
      </div>
    </main>
  );
}
