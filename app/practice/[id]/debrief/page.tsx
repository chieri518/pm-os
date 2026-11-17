import { notFound } from "next/navigation";
import { graph } from "@/src/graph/bundle";
import type { Concept, InterviewGuide, QuestionType } from "@/src/schema/nodes";
import { competencyLabel } from "@/src/practice/competencies";
import { Nav } from "../../../nav";
import { DebriefView } from "./view";

export function generateStaticParams() {
  return graph.guides().map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const g = graph.get<InterviewGuide>("interview_guide", (await params).id);
  if (!g) return { title: "Not found" };
  return {
    title: "Your mock interview debrief",
    description: `Plus/Delta debrief for: ${g.question}`,
    // Each debrief is personal and lives in the link's fragment; the shell has
    // nothing worth indexing.
    robots: { index: false, follow: true },
  };
}

export default async function DebriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = graph.get<InterviewGuide>("interview_guide", id);
  if (!g) notFound();
  const qt = graph.get<QuestionType>("question_type", g.question_type);

  // What to study next: the concepts this question type assumes you know.
  const study = graph
    .edgesFrom({ type: "question_type", id: g.question_type }, "REQUIRES")
    .map((e) => graph.get<Concept>("concept", e.to.id))
    .filter((c): c is Concept => Boolean(c))
    .map((c) => ({ href: `/concept/${c.id}`, name: c.name, line: c.in_one_line }));

  // What to run next: guides that exercise what this one could not show.
  const gaps = g.competencies.not_tested;
  const next = graph
    .guides()
    .filter((o) => o.id !== g.id && o.competencies.core.some((c) => gaps.includes(c)))
    .slice(0, 3)
    .map((o) => ({
      href: `/practice/${o.id}`,
      question: o.question,
      covers: o.competencies.core.filter((c) => gaps.includes(c)).map(competencyLabel),
    }));

  return (
    <main className="mx-auto max-w-[760px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav crumb={{ label: "Debrief" }} />
      <DebriefView
        guideId={g.id}
        question={g.question}
        questionType={qt ? { href: `/question/${qt.id}`, name: qt.name } : null}
        signalGroups={g.signal_groups.map((sg) => ({
          dimension: sg.dimension,
          signals: sg.signals.map((s) => s.observable),
        }))}
        antiSignals={g.anti_signals.map((a) => a.observable)}
        plusLines={g.debrief.plus}
        deltaLines={g.debrief.delta}
        mostCommon={g.debrief.most_common}
        notTested={gaps.map(competencyLabel)}
        study={study}
        next={next}
      />
    </main>
  );
}
