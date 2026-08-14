import Link from "next/link";
import type { Route } from "next";
import { graph } from "@/src/graph/bundle";
import { Nav } from "../../nav";
import { Section } from "../../teaching";

export const metadata = {
  title: "Running a session",
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

/**
 * Tiers match the company-lens convention: `official` means the organisation says
 * this itself in public, `corroborated` means consistently reported but not
 * first-party. Peer-reviewed findings are marked official — the authors are the
 * primary source for their own result.
 */
const SOURCES: { label: string; tier: "official" | "corroborated"; url?: string }[] = [
  {
    label:
      "Sackett, Zhang, Berry & Lievens (2022), Revisiting meta-analytic estimates of validity in personnel selection, Journal of Applied Psychology",
    tier: "official",
    url: "https://psycnet.apa.org/record/2022-25060-001",
  },
  {
    label:
      "Campion, Palmer & Campion (1997), A review of structure in the selection interview, Personnel Psychology",
    tier: "official",
    url: "https://onlinelibrary.wiley.com/doi/10.1111/j.1744-6570.1997.tb00709.x",
  },
  {
    label: "Google re:Work — A guide to structured interviewing for better hiring practices",
    tier: "official",
    url: "https://rework.withgoogle.com/intl/en/guides/a-guide-to-structured-interviewing-for-better-hiring-practices",
  },
  {
    label:
      "Ross School of Business Consulting Club casebook (2010) — every case carries a “guidance for interviewer and information provided upon request” page",
    tier: "official",
    url: "https://caseinterview.com/wp-content/uploads/2019/08/Ross2010.pdf",
  },
  {
    label:
      "Amazon’s Bar Raiser programme — trainees shadow loops and are certified before running their own; widely reported, not documented first-party",
    tier: "corroborated",
  },
];

export default function RunningASessionPage() {
  const guides = graph.guides();
  return (
    <main className="mx-auto max-w-[820px] px-4 py-6 sm:px-6 sm:py-8">
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

        <div id="information" className="scroll-mt-6">
          <Section
            title="Information discipline"
            note="The half of the question the candidate never sees."
          >
            <div className="space-y-3 text-[14.5px] leading-relaxed text-ink-300">
              <p>
                A case question is really two documents. The candidate gets one sentence; you get
                the world that sentence was cut out of — what is true, what you may hand over, what
                has to be earned, and what stays with you. Every guide here carries that second
                document as a{" "}
                <span className="text-ink-100">situation brief</span> in the right-hand rail.
              </p>
              <p>
                <span className="text-ink-100">Withhold what tests judgement; grant what is
                merely missing context.</span> This is the only rule you need, and it resolves
                almost every case. The business goal, the company size, the timeframe — hand those
                over the moment they are asked, because making someone guess at scaffolding just
                burns their clock. Which user to design for, what &ldquo;improve&rdquo; means, which
                metric matters — never, however directly they ask, because choosing is the thing
                being scored.
              </p>
              <p>
                <span className="text-ink-100">Decide before the session, not during it.</span> An
                interviewer improvising the boundary tends to give ground to whoever pushes hardest,
                which quietly turns the question into a test of assertiveness. Each brief splits its
                facts four ways — say it, give it if asked, give it only if they ask precisely, and
                hold it — so the decision is already made when a candidate is looking at you
                expectantly.
              </p>
              <p>
                <span className="text-ink-100">Invent freely, then write it down.</span> If they ask
                for a number you do not have, make up something reasonable and say it with
                confidence — refusing to answer tests nothing. But whatever you invent becomes part
                of the question, so it has to be identical for the next candidate. The briefs fix
                these in advance for exactly this reason, and flag which figures are invented so you
                never present them to a candidate as real research.
              </p>
              <p>
                <span className="text-ink-100">One question deliberately breaks the rule.</span>{" "}
                The market-entry guide has you refuse every request for data, warmly and
                identically. That is not information discipline for its own sake — the discomfort is
                the measurement, and it disappears the instant you supply one sympathetic statistic.
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-ink-800 bg-ink-900/60 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                Why standardisation, and not just fairness
              </div>
              <div className="space-y-2.5 text-[13.5px] leading-relaxed text-ink-300">
                <p>
                  Consistency is not politeness — it is most of what makes an interview predict
                  anything. Correcting a long-standing statistical error in how these studies were
                  pooled, Sackett and colleagues put structured interviews at roughly{" "}
                  <span className="font-mono text-live-400">ρ&nbsp;=&nbsp;.42</span> against job
                  performance and unstructured ones at{" "}
                  <span className="font-mono text-warn-400">ρ&nbsp;=&nbsp;.19</span>. Same hour, same
                  people, more than double the signal — the difference is almost entirely
                  procedural.
                </p>
                <p>
                  Two of the fifteen structure components Campion, Palmer and Campion catalogued are
                  asking every candidate the same questions and limiting improvised prompting and
                  elaboration. A brief is how you actually do the second one: the follow-ups are
                  pre-written, so the depth a candidate gets does not depend on how interesting you
                  found them.
                </p>
                <p>
                  The format is borrowed openly from consulting casebooks, where every case ships a{" "}
                  <em>guidance for interviewer and information provided upon request</em> page facing
                  the problem statement. The discipline is a solved problem in that world and has
                  simply never been written down for product interviews.
                </p>
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-ink-800 pt-2.5">
                {SOURCES.map((s) => (
                  <li key={s.label} className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide ${
                        s.tier === "official"
                          ? "border-live-600/40 bg-live-600/10 text-live-400"
                          : "border-ink-600 bg-ink-850 text-ink-400"
                      }`}
                    >
                      {s.tier}
                    </span>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 text-ink-300 underline-offset-2 hover:text-ink-100 hover:underline"
                      >
                        {s.label}
                      </a>
                    ) : (
                      <span className="min-w-0 text-ink-300">{s.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </div>

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
