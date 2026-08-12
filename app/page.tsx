import Link from "next/link";
import { graph } from "@/src/graph/bundle";
import { Nav } from "./nav";
import { EvidenceTag } from "./ui";

export const metadata = {
  title: "pm-os · PM Interview & Career OS",
  description:
    "Question types, frameworks, behavioural heuristics and company rubrics — with the caveats attached.",
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
    label: "Experience heuristics",
    blurb: "Act on a user in a situation. They fire — or do not — depending on context.",
  },
  decision: {
    label: "Decision heuristics",
    blurb: "Act on your own reasoning. Always available; independent of any user's context.",
  },
};

export default function LibraryPage() {
  const questions = graph.questionTypes();
  const concepts = graph.concepts();
  const heuristics = graph.heuristics();
  const frameworks = graph.frameworks();
  const lenses = graph.lenses();

  const families = ["product", "analytical", "behavioral", "technical"] as const;

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-8">
      <Nav />

      <header className="mb-10 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">
          Start from the question you&apos;ll actually be asked.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
          Nobody walks into an interview thinking &ldquo;I need a procedural framework&rdquo;. They
          think &ldquo;I&apos;ve been asked to design a product&rdquo;. So question types are the
          entry point here, and each one links to the structures that fit it, the heuristics that
          apply inside it, and the companies that weight it most.
        </p>
        <p className="mt-3 text-[13px] text-ink-400">
          Built as a companion to{" "}
          <span className="text-ink-300">Cracking the PM Interview</span> (McDowell &amp; Bavaro) —
          it covers the same ground with the research checked, the caveats attached, and the
          concepts linked to each other rather than listed in chapters.
        </p>
      </header>

      {/* ------------------------------------------------ question types */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-100">
            Question types
          </h2>
          <span className="text-xs text-ink-400">{questions.length} types · start here</span>
        </div>

        {families.map((family) => {
          const items = questions.filter((q) => q.family === family);
          if (!items.length) return null;
          return (
            <div key={family} className="mb-5">
              <div className="mb-2 flex items-baseline gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-300">
                  {family}
                </span>
                <span className="text-[11px] text-ink-400">{FAMILY_COPY[family]}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((q) => (
                  <Link
                    key={q.id}
                    href={`/question/${q.id}`}
                    className="group rounded-xl border border-ink-800 bg-ink-900/70 p-4 transition-colors hover:border-ink-600 hover:bg-ink-850"
                  >
                    <h3 className="text-[15px] font-medium text-ink-100">{q.name}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-300">
                      {q.teaching?.in_one_line}
                    </p>
                    <p className="mt-2 font-mono text-[10px] text-ink-400">
                      {q.approach.length} steps · {q.sample_questions.length} practice questions
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ------------------------------------------------ concepts */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-100">
            Concepts
          </h2>
          <span className="text-xs text-ink-400">
            The taught curriculum — each written at three depths, with an evidence verdict.
          </span>
        </div>
        {DOMAINS.map((domain) => {
          const items = concepts.filter((c) => c.domain === domain);
          if (!items.length) return null;
          return (
            <div key={domain} className="mb-5">
              <div className="mb-2 flex items-baseline gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-300">
                  {domain}
                </span>
                <span className="text-[11px] text-ink-400">{DOMAIN_COPY[domain]}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((c) => (
                  <Link
                    key={c.id}
                    href={`/concept/${c.id}`}
                    className="rounded-xl border border-ink-800 bg-ink-900/70 p-4 transition-colors hover:border-ink-600 hover:bg-ink-850"
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-medium text-ink-100">{c.name}</h3>
                      <EvidenceTag strength={c.evidence.strength} />
                    </div>
                    <p className="text-[13px] leading-relaxed text-ink-300">{c.in_one_line}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ------------------------------------------------ frameworks */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-100">
            Frameworks
          </h2>
          <span className="text-xs text-ink-400">
            Four structurally different kinds — only procedural ones carry a time budget.
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {frameworks.map((f) => (
            <Link
              key={f.id}
              href={`/framework/${f.id}`}
              className="rounded-xl border border-ink-800 bg-ink-900/70 p-4 transition-colors hover:border-ink-600 hover:bg-ink-850"
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-medium text-ink-100">{f.name}</h3>
                <span className="shrink-0 rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[9px] uppercase text-ink-400">
                  {f.kind}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-ink-300">
                {f.teaching?.in_one_line ?? f.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ heuristics */}
      {(["experience", "decision"] as const).map((scope) => {
        const items = heuristics.filter((h) => h.scope === scope);
        if (!items.length) return null;
        return (
          <section key={scope} className="mb-10">
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-100">
                {SCOPE_COPY[scope]!.label}
              </h2>
              <span className="text-xs text-ink-400">{SCOPE_COPY[scope]!.blurb}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((h) => (
                <Link
                  key={h.id}
                  href={`/heuristic/${h.id}`}
                  className="rounded-xl border border-ink-800 bg-ink-900/70 p-4 transition-colors hover:border-ink-600 hover:bg-ink-850"
                >
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-medium text-ink-100">{h.name}</h3>
                    <EvidenceTag strength={h.evidence_strength} />
                  </div>
                  <p className="text-[13px] leading-relaxed text-ink-300">
                    {h.teaching?.in_one_line ?? h.claim}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* ------------------------------------------------ lenses */}
      <section className="mb-10">
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-100">
            Company lenses
          </h2>
          <span className="text-xs text-ink-400">
            The same answer scores differently depending on who is listening. Now sourced, with provenance graded per claim.
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lenses.map((l) => (
            <Link
              key={l.id}
              href={`/company/${l.id}`}
              className="rounded-xl border border-ink-800 bg-ink-900/70 p-4 transition-colors hover:border-ink-600 hover:bg-ink-850"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-medium text-ink-100">{l.company}</h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                  {l.loop.length} rounds
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-300">
                {l.values_label ?? "What they evaluate"} · {l.values.length} criteria
              </p>
              {l.myths.length > 0 && (
                <p className="mt-2 font-mono text-[10px] text-warn-400">
                  {l.myths.length} common myths corrected
                </p>
              )}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-ink-400">
          Practise against any of them — the{" "}
          <Link
            href="/practice"
            className="text-ink-100 underline decoration-ink-600 underline-offset-4 hover:decoration-ink-400"
          >
            practice builder
          </Link>{" "}
          times your answer to the company&apos;s stage weights rather than the framework&apos;s.
        </p>
      </section>

      <footer className="border-t border-ink-800 pt-4 font-mono text-[10px] leading-relaxed text-ink-400">
        Evidence tags are honest: <span className="text-warn-400">contested</span> means the finding
        is under active academic dispute. Company rubric weights are researched estimates from
        published guidance, not insider information.
      </footer>
    </main>
  );
}
