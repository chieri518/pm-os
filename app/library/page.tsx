import Link from "next/link";
import type { Route } from "next";
import { graph } from "@/src/graph/bundle";
import { Nav } from "../nav";
import { EvidenceTag } from "../ui";
import { LibrarySection, Meta, Row, RowGroup } from "../rows";

export const metadata = {
  title: "Library",
  description:
    "Everything in one list — question types, concepts, frameworks, heuristics and company lenses, with evidence verdicts attached.",
};

const FAMILY_COPY: Record<string, string> = {
  product: "Design, improve, critique. The heart of most PM loops.",
  analytical: "Numbers, structure, and judgement under missing data.",
  behavioral: "Your own experience, told so it can be scored.",
  technical: "Enough depth that engineers will follow you.",
};

const DOMAINS = [
  "customer",
  "strategy",
  "economics",
  "experimentation",
  "metrics",
  "analytical",
  "process",
  "technical",
] as const;

const DOMAIN_COPY: Record<string, string> = {
  customer: "Who you are building for, and what they are actually trying to do.",
  strategy: "Why an advantage lasts, and whether the market wants this at all.",
  economics: "Whether a customer makes money, and what to charge them.",
  experimentation: "Making a causal claim you can defend.",
  metrics: "Choosing what to measure, and reading it without fooling yourself.",
  analytical: "Structuring a problem so the answer is findable.",
  process: "How the work gets decided, goaled, and shipped.",
  technical: "Enough depth that engineers will follow you — and you will follow them.",
};

const SCOPE_COPY: Record<string, { label: string; blurb: string }> = {
  experience: {
    label: "experience",
    blurb: "Act on a user in a situation — they fire, or do not, depending on context.",
  },
  decision: {
    label: "decision",
    blurb: "Act on your own reasoning. Always available.",
  },
};

const JUMP = [
  { href: "#questions", label: "Questions" },
  { href: "#concepts", label: "Concepts" },
  { href: "#frameworks", label: "Frameworks" },
  { href: "#heuristics", label: "Heuristics" },
  { href: "#companies", label: "Companies" },
];

export default function LibraryPage() {
  const questions = graph.questionTypes();
  const concepts = graph.concepts();
  const frameworks = graph.frameworks();
  const heuristics = graph.heuristics();
  const lenses = graph.lenses();
  const terms = graph.terms();

  const families = ["product", "analytical", "behavioral", "technical"] as const;

  return (
    <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav crumb={{ label: "Library" }} />

      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Library</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-300">
          Everything, in one list. Hit <span className="font-mono text-ink-100">⌘K</span> if you know
          what you are looking for — this page is for when you don&apos;t.
        </p>
      </header>

      {/*
        Anchors rather than a client-side filter. Five destinations over 47 items
        does not justify shipping JavaScript, and anchors keep every section
        linkable from the homepage doors and from outside.
      */}
      <div className="sticky top-0 z-10 -mx-4 mb-8 border-b border-ink-800 bg-ink-950/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="-mx-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-1">
            {JUMP.map((j) => (
              <a
                key={j.href}
                href={j.href}
                className="rounded-lg px-2.5 py-1 text-[13px] text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
              >
                {j.label}
              </a>
            ))}
            <Link
              href={"/glossary" as Route}
              className="rounded-lg px-2.5 py-1 text-[13px] text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
            >
              Glossary ↗
            </Link>
          </div>
        </div>
      </div>

      <LibrarySection
        id="questions"
        title="Question types"
        count={`${questions.length}`}
        note="What you are actually asked. Start here."
      >
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
      </LibrarySection>

      <LibrarySection
        id="concepts"
        title="Concepts"
        count={`${concepts.length}`}
        note="Written at three depths, each with an evidence verdict."
      >
        {DOMAINS.map((domain) => {
          const items = concepts.filter((c) => c.domain === domain);
          if (!items.length) return null;
          return (
            <RowGroup key={domain} label={domain} note={DOMAIN_COPY[domain]}>
              {items.map((c) => (
                <Row
                  key={c.id}
                  href={`/concept/${c.id}`}
                  name={c.name}
                  blurb={c.in_one_line}
                  meta={<EvidenceTag strength={c.evidence.strength} />}
                />
              ))}
            </RowGroup>
          );
        })}
      </LibrarySection>

      <LibrarySection
        id="frameworks"
        title="Frameworks"
        count={`${frameworks.length}`}
        note="Four structurally different kinds — only procedural ones carry a time budget."
      >
        <ul className="divide-y divide-ink-800/50 border-t border-ink-800/50">
          {frameworks.map((f) => (
            <Row
              key={f.id}
              href={`/framework/${f.id}`}
              name={f.name}
              blurb={f.teaching?.in_one_line ?? f.summary}
              meta={<Meta>{f.kind}</Meta>}
            />
          ))}
        </ul>
      </LibrarySection>

      <LibrarySection
        id="heuristics"
        title="Heuristics"
        count={`${heuristics.length}`}
        note="Claims about behaviour, with the evidence graded and the misuse named."
      >
        {(["experience", "decision"] as const).map((scope) => {
          const items = heuristics.filter((h) => h.scope === scope);
          if (!items.length) return null;
          return (
            <RowGroup
              key={scope}
              label={SCOPE_COPY[scope]!.label}
              note={SCOPE_COPY[scope]!.blurb}
            >
              {items.map((h) => (
                <Row
                  key={h.id}
                  href={`/heuristic/${h.id}`}
                  name={h.name}
                  blurb={h.teaching?.in_one_line ?? h.claim}
                  meta={<EvidenceTag strength={h.evidence_strength} />}
                />
              ))}
            </RowGroup>
          );
        })}
      </LibrarySection>

      <LibrarySection
        id="companies"
        title="Company lenses"
        count={`${lenses.length}`}
        note="The same answer scores differently depending on who is listening."
      >
        <ul className="divide-y divide-ink-800/50 border-t border-ink-800/50">
          {lenses.map((l) => (
            <Row
              key={l.id}
              href={`/company/${l.id}`}
              name={l.company}
              blurb={`${l.values_label ?? "What they evaluate"} · ${l.values.length} criteria · ${l.loop.length} rounds`}
              meta={
                l.myths.length > 0 ? (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-warn-400">
                    {l.myths.length} myths
                  </span>
                ) : null
              }
            />
          ))}
        </ul>
      </LibrarySection>

      <p className="mb-8 text-[13px] leading-relaxed text-ink-400">
        Plus{" "}
        <Link
          href={"/glossary" as Route}
          className="text-live-400 underline-offset-2 hover:underline"
        >
          {terms.length} glossary terms
        </Link>{" "}
        auto-linked on first mention throughout, and{" "}
        <Link href={"/graph" as Route} className="text-live-400 underline-offset-2 hover:underline">
          the graph
        </Link>{" "}
        if you would rather see how it all connects.
      </p>

      <footer className="border-t border-ink-800 pt-4 font-mono text-[10px] leading-relaxed text-ink-400">
        Evidence tags are honest: <span className="text-warn-400">contested</span> means the finding
        is under active academic dispute. Company rubric weights are researched estimates from
        published guidance, not insider information.
      </footer>
    </main>
  );
}
