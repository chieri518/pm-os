import Link from "next/link";
import type { Route } from "next";
import { graph } from "@/src/graph/bundle";
import { Nav } from "./nav";
import { Meta, Row, RowGroup } from "./rows";

/*
 * The homepage used to be the whole library: 47 equal-weight cards over 4,400px,
 * grouped by taxonomy. That is a fine catalogue and a bad front door — it answers
 * "what is in here" when the visitor's question is "where do I start".
 *
 * So the catalogue moved to /library and this page routes by intent instead. The
 * four doors are the four reasons anyone opens this site, and the one that covers
 * most of them — an interview is coming — resolves inline rather than sending you
 * somewhere else to find eight items.
 */

const FAMILY_COPY: Record<string, string> = {
  product: "Design, improve, critique. The heart of most PM loops.",
  analytical: "Numbers, structure, and judgement under missing data.",
  behavioral: "Your own experience, told so it can be scored.",
  technical: "Enough depth that engineers will follow you.",
};

export default function HomePage() {
  const questions = graph.questionTypes();
  const concepts = graph.concepts();
  const lenses = graph.lenses();
  const guides = graph.guides();
  const frameworks = graph.frameworks();
  const heuristics = graph.heuristics();
  const terms = graph.terms();

  const families = ["product", "analytical", "behavioral", "technical"] as const;

  const DOORS: {
    href: Route;
    kicker: string;
    title: string;
    blurb: string;
    meta: string;
  }[] = [
    {
      href: "#questions" as Route,
      kicker: "An interview is coming up",
      title: "Start from the question",
      blurb:
        "Nobody walks in thinking “I need a procedural framework”. They think “I've been asked to design a product”. Each type carries the approach, the pacing, and what is actually being scored.",
      meta: `${questions.length} question types`,
    },
    {
      href: "/library#concepts" as Route,
      kicker: "Learning it properly",
      title: "Work through the concepts",
      blurb:
        "Each written at three depths — orientation, working, expert — with a verdict on how good the evidence actually is. Six widely taught claims here are labelled contested, with citations.",
      meta: `${concepts.length} concepts · ${frameworks.length} frameworks · ${heuristics.length} heuristics`,
    },
    {
      href: "/library#companies" as Route,
      kicker: "Targeting a specific company",
      title: "Read the lens first",
      blurb:
        "The same answer scores differently depending on who is listening. What each company publishes, how its loop is built, and where common prep advice contradicts the company's own words.",
      meta: `${lenses.length} lenses, sourced per claim`,
    },
    {
      href: "/interviewer" as Route,
      kicker: "You are running the interview",
      title: "Take the other chair",
      blurb:
        "The half nobody publishes: the situation brief behind the prompt, what to grant and what to hold back, a probe ladder, a signal checklist, and what not to score on.",
      meta: `${guides.length} interviewer guides`,
    },
  ];

  return (
    <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav />

      {/*
        Task framing, not a pitch. Someone arriving here already knows they are
        preparing for a PM interview; what they do not know is where to start, so the
        heading asks the only question worth asking and the four doors answer it.
        The positioning line stays to one sentence and sits below the fold-line of
        attention rather than above it.
      */}
      <header className="mb-6 max-w-2xl">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink-100">
          What are you working on?
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-400">
          A companion to <span className="text-ink-300">Cracking the PM Interview</span> — same
          ground, with the sources graded and the contested claims labelled.
        </p>
      </header>

      {/* ------------------------------------------------ the four doors */}
      <div className="mb-12 grid gap-3 sm:grid-cols-2">
        {DOORS.map((d) => (
          <Link
            key={d.title}
            href={d.href}
            className="group flex flex-col rounded-xl border border-ink-800 bg-ink-900/70 p-4 transition-colors hover:border-ink-600 hover:bg-ink-850"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-live-400">
              {d.kicker}
            </span>
            <h2 className="mt-1.5 text-[16px] font-medium text-ink-100">
              {d.title}
              <span
                aria-hidden
                className="ml-1.5 inline-block text-ink-600 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-400"
              >
                →
              </span>
            </h2>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-300">{d.blurb}</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink-400">
              {d.meta}
            </p>
          </Link>
        ))}
      </div>

      {/* ------------------------------------------------ the first door, resolved */}
      <section id="questions" className="mb-10 scroll-mt-6">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-100">
            Question types
          </h2>
          <span className="font-mono text-[10px] text-live-400">{questions.length}</span>
          <span className="text-xs text-ink-400">
            The entry point everything else hangs off.
          </span>
        </div>

        {families.map((family) => {
          const items = questions.filter((q) => q.family === family);
          if (!items.length) return null;
          return (
            <RowGroup key={family} label={family} note={FAMILY_COPY[family]}>
              {items.map((q) => (
                <Row
                  key={q.id}
                  href={`/question/${q.id}`}
                  name={q.name}
                  blurb={q.teaching?.in_one_line}
                  meta={<Meta>{q.approach.length} steps</Meta>}
                />
              ))}
            </RowGroup>
          );
        })}
      </section>

      <Link
        href={"/library" as Route}
        className="mb-8 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-ink-800 bg-ink-900/70 p-4 transition-colors hover:border-ink-600 hover:bg-ink-850"
      >
        <span className="text-[15px] font-medium text-ink-100">
          Everything, in one list
          <span aria-hidden className="ml-1.5 text-ink-600">
            →
          </span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
          {concepts.length} concepts · {frameworks.length} frameworks · {heuristics.length}{" "}
          heuristics · {lenses.length} lenses · {terms.length} terms
        </span>
      </Link>

      <footer className="border-t border-ink-800 pt-4 font-mono text-[10px] leading-relaxed text-ink-400">
        Evidence tags are honest: <span className="text-warn-400">contested</span> means the finding
        is under active academic dispute. Company rubric weights are researched estimates from
        published guidance, not insider information.
      </footer>
    </main>
  );
}
