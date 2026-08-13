import Link from "next/link";
import type { Route } from "next";
import { graph } from "@/src/graph/bundle";
import type { QuestionType } from "@/src/schema/nodes";
import { Nav } from "../nav";

export const metadata = {
  title: "Interviewer guides · pm-os",
  description:
    "What the person on the other side of the table is holding: probe ladders, rescue lines, signal checklists and bias guards.",
};

export default function InterviewerIndex() {
  const guides = graph.guides();
  const probes = guides.reduce((n, g) => n + g.probes.length, 0);
  const signals = guides.reduce((n, g) => n + g.signal_groups.flatMap((s) => s.signals).length, 0);

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-8">
      <Nav crumb={{ label: "Interviewer guides" }} />

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">
          What your interviewer is holding.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
          Every prep site publishes questions and model answers. Almost none publish the other side
          of the table — how to deliver the prompt, which clarifications to grant and which to hand
          back, when to probe deeper, how to unstick someone without giving it away, and what to
          refuse to score on.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
          These are written to be used live by someone running a mock interview. If you are the
          candidate, read them anyway — studying the checklist tells you more about what earns a
          score than practising blind ever will.
        </p>
        <p className="mt-4 rounded-lg border border-warn-400/25 bg-warn-400/[0.04] p-3 text-[13px] leading-relaxed text-ink-300">
          <span className="font-mono text-[10px] uppercase tracking-wider text-warn-400">
            constructed ·{" "}
          </span>
          Built from published evaluation criteria, not reproduced from any company&apos;s internal
          material — which is confidential and not public. Each guide states how it was assembled.
        </p>
        <p className="mt-3 font-mono text-[11px] text-ink-400">
          {guides.length} guides · {probes} probes · {signals} observable signals
        </p>
        <p className="mt-4">
          <Link
            href={"/interviewer/running-a-session" as Route}
            className="inline-block rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-[13px] text-ink-200 transition-colors hover:border-ink-600 hover:text-ink-100"
          >
            First time running one? Start with the session structure →
          </Link>
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {guides.map((g) => {
          const qt = graph.get<QuestionType>("question_type", g.question_type);
          const signalCount = g.signal_groups.flatMap((s) => s.signals).length;
          return (
            <Link
              key={g.id}
              href={`/interviewer/${g.id}` as Route}
              className="flex flex-col rounded-xl border border-ink-800 bg-ink-900/70 p-4 transition-colors hover:border-ink-600 hover:bg-ink-850"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                  {qt?.name ?? g.question_type}
                </span>
                <span className="font-mono text-[10px] text-ink-600">
                  {g.difficulty} · {g.duration_min}m
                </span>
              </div>
              <h2 className="text-[15px] font-medium leading-snug text-ink-100">{g.question}</h2>
              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-300">
                {g.intent}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {g.competencies.core.map((c) => (
                  <span
                    key={c}
                    className="rounded border border-live-600/30 bg-live-600/10 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide text-live-400"
                  >
                    {c.split("-")[0]}
                  </span>
                ))}
              </div>
              <p className="mt-2 font-mono text-[10px] text-ink-400">
                {g.probes.length} probes · {signalCount} signals · {g.bias_guards.length} bias guards
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
