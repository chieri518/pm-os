import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { graph } from "@/src/graph/bundle";
import type { InterviewGuide, QuestionType } from "@/src/schema/nodes";
import { Nav } from "../../nav";
import { SessionTimer } from "../../timer";
import { CopyButton } from "../../copy-button";

/*
 * The candidate's side of a mock interview.
 *
 * It shows exactly what a real candidate gets: the prompt, the handful of facts an
 * interviewer says out loud anyway (`release: stated`), and a clock. No pacing
 * checkpoints, no hints, no link to the guide in the main flow — everything else
 * is the interviewer's to hold, and seeing it first would spoil the exercise.
 */

export function generateStaticParams() {
  return graph.guides().map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const g = graph.get<InterviewGuide>("interview_guide", (await params).id);
  if (!g) return { title: "Not found" };
  return {
    title: `Mock interview: ${g.question}`,
    description: "The candidate's view of a mock PM interview — the prompt and a clock, nothing that gives it away.",
  };
}

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = graph.get<InterviewGuide>("interview_guide", id);
  if (!g) notFound();
  const qt = graph.get<QuestionType>("question_type", g.question_type);
  const stated = g.brief.facts.filter((f) => f.release === "stated");

  return (
    <main className="mx-auto max-w-[760px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav crumb={{ label: "Mock interview" }} />

      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-wider text-live-400">
          Mock interview · {qt?.name ?? g.question_type} · {g.duration_min} min
        </p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-ink-100 [text-wrap:balance]">
          {g.question}
        </h1>
      </header>

      {stated.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">
            What your interviewer tells everyone
          </h2>
          <ul className="space-y-1.5">
            {stated.map((f) => (
              <li key={f.fact} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-300">
                <span aria-hidden className="mt-0.5 shrink-0 text-ink-600">
                  —
                </span>
                {f.fact}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6 rounded-xl border border-ink-800 bg-ink-900/70 p-4">
        <SessionTimer minutes={g.duration_min} large />
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-800 bg-ink-900/70 p-4">
          <h2 className="text-[13px] font-medium text-ink-100">How this works</h2>
          <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-ink-300">
            <li>Think out loud. Your partner is scoring your reasoning, not your final answer.</li>
            <li>
              Ask clarifying questions. Some answers they give freely, some only if you ask
              precisely, and some they will hold — deciding without them is part of the exercise.
            </li>
            <li>At the end they will send you a debrief link to keep.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-ink-800 bg-ink-900/70 p-4">
          <h2 className="text-[13px] font-medium text-ink-100">Arranging it yourself?</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-300">
            Send your partner the interviewer guide. It tells them what to hold back, when to
            probe, and what to score — so they don&apos;t need interviewing experience.
          </p>
          <div className="mt-3">
            <CopyButton
              label="Copy interviewer link"
              path={`/interviewer/${g.id}`}
            />
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-400">
            Don&apos;t open it yourself until you&apos;re done. It contains the answers to your
            clarifying questions.
          </p>
        </div>
      </section>

      {qt && (
        <p className="text-[13px] text-ink-400">
          Afterwards:{" "}
          <Link
            href={`/question/${qt.id}` as Route}
            className="text-live-400 underline-offset-2 hover:underline"
          >
            how {qt.name.toLowerCase()} questions are scored →
          </Link>
        </p>
      )}
    </main>
  );
}
