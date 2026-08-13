import Link from "next/link";
import type { Route } from "next";
import { graph } from "@/src/graph/bundle";
import { Nav } from "../../nav";
import { Section } from "../../teaching";

export const metadata = {
  title: "Running a session · pm-os",
  description:
    "The shape of a PM interview, how to act as a collaborative partner, and how to debrief.",
};

const ARC = [
  { block: "Introduction", mins: "3–5", what: "Pleasantries, a quick resume check, and setting the stage for which question type this is. Tell them you'll interrupt with follow-ups so it doesn't read as hostility later." },
  { block: "The core question", mins: "30–35", what: "They work the prompt. You steer with probes rather than hints, and keep an eye on the clock against the guide's checkpoints." },
  { block: "Candidate questions", mins: "5", what: "They ask you about the role, the team, the company. What they choose to ask is itself informative — and skipping this in a mock wastes a rep they'll need." },
  { block: "Debrief", mins: "5", what: "Mock only, and the reason the session was worth running. Plus / Delta, specific, two or three of each." },
];

const LOOK_FOR = [
  { name: "Structure & frameworks", what: "Is there a logical way of breaking down an ambiguous problem — goals, users, pain points, solutions, prioritisation — or is it free association?" },
  { name: "Customer empathy", what: "Do they build for themselves, or do they actively reason about segments, edge cases and accessibility?" },
  { name: "Prioritisation & trade-offs", what: "Can they say no to a good idea? Weighing impact against effort, and naming what gets dropped." },
  { name: "Communication & collaboration", what: "Do they treat you as a partner, or monologue for ten minutes? PMs lead through influence, and this is the closest proxy available." },
  { name: "Business acumen", what: "Do monetisation, company mission, and success metrics appear at all — or is it product design in a vacuum?" },
];

export default function RunningASessionPage() {
  const guides = graph.guides();
  return (
    <main className="mx-auto max-w-[820px] px-6 py-8">
      <Nav crumb={{ label: "Running a session", href: "/interviewer" as Route }} />

      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Running a session</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
          The parts that are the same whichever question you run. The{" "}
          <Link href="/interviewer" className="text-live-400 underline-offset-2 hover:underline">
            individual guides
          </Link>{" "}
          cover what changes.
        </p>
      </header>

      <div className="space-y-8">
        <Section title="The arc" note="45–60 minutes, and it is fairly standard across companies.">
          <ol className="space-y-2">
            {ARC.map((a) => (
              <li key={a.block} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-medium text-ink-100">{a.block}</span>
                  <span className="shrink-0 font-mono text-[11px] text-live-400">{a.mins} min</span>
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-300">{a.what}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="What you are grading" note="Not the answer. How they think and communicate.">
          <div className="space-y-2">
            {LOOK_FOR.map((l) => (
              <div key={l.name} className="rounded-lg border border-ink-800 bg-ink-900/60 p-3">
                <div className="text-[14px] font-medium text-ink-100">{l.name}</div>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-300">{l.what}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Be a collaborative partner, not a silent examiner"
          note="The biggest adjustment if your background is technical interviewing."
        >
          <div className="space-y-3 text-[14.5px] leading-relaxed text-ink-300">
            <p>
              <span className="text-ink-100">Let them lead, with guardrails.</span> PM prompts are
              intentionally vague and the ambiguity is the test. But if they start pitching
              solutions immediately, stop them — <em>&ldquo;before we dive into solutions, who are
              we building for and what problem are we solving?&rdquo;</em> That intervention is not
              helping them; it is producing the signal.
            </p>
            <p>
              <span className="text-ink-100">Invent constraints when asked.</span> If they ask
              whether the goal is acquisition or monetisation, or whether you have data on how many
              users hit a problem, make something reasonable up and say it with confidence. You are
              testing whether they can adapt to a constraint, and refusing to answer tests nothing.
              Write down whatever you invent so it stays identical for the next candidate.
            </p>
            <p>
              <span className="text-ink-100">Push back once.</span> Challenge whatever they land on,
              regardless of whether you agree — <em>&ldquo;how do we know users actually care about
              that? Wouldn&apos;t it add friction?&rdquo;</em> You are watching whether they defend
              with reasoning, concede the fair part, and stay un-defensive. Challenging only the
              ideas you personally dislike turns your taste into the rubric.
            </p>
            <p>
              <span className="text-ink-100">Watch the clock out loud.</span> At the twenty-minute
              mark, if they are still on segments: <em>&ldquo;we&apos;ve got about twenty minutes
              left — let&apos;s look at how you&apos;d prioritise.&rdquo;</em> Time management is
              partly your job in a mock, because a candidate who runs out of clock never reaches the
              stages that carry the most points.
            </p>
          </div>
        </Section>

        <Section title="Debriefing — Plus / Delta" note="Five minutes, and the reason a mock is worth more than solo practice.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-live-600/30 bg-live-600/[0.05] p-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-live-400">
                Plus
              </div>
              <p className="text-[13.5px] leading-relaxed text-ink-300">
                What specifically worked, quoted back. &ldquo;You committed to one segment and said
                why you rejected the others&rdquo; beats &ldquo;good structure&rdquo; — they can
                repeat the first and cannot repeat the second.
              </p>
            </div>
            <div className="rounded-lg border border-warn-400/30 bg-warn-400/[0.04] p-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-warn-400">
                Delta
              </div>
              <p className="text-[13.5px] leading-relaxed text-ink-300">
                A specific change, not a deficiency. &ldquo;Name the criterion before you rank&rdquo;
                is actionable; &ldquo;weak on prioritisation&rdquo; is a label they can do nothing
                with.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-300">
            Two or three of each is plenty. Every guide carries pre-written Plus and Delta prompts
            for its own question, plus the single most common thing to tell someone after it.
          </p>
        </Section>

        <Section title="Pick a question" note={`${guides.length} guides available.`}>
          <div className="flex flex-wrap gap-2">
            {guides.map((g) => (
              <Link
                key={g.id}
                href={`/interviewer/${g.id}` as Route}
                className="rounded-lg border border-ink-800 bg-ink-900/70 px-3 py-2 text-[13px] text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
              >
                {g.question.length > 58 ? `${g.question.slice(0, 58)}…` : g.question}
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
