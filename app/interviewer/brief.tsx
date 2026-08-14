import Link from "next/link";
import type { Route } from "next";
import type { Release, SituationBrief } from "@/src/schema/nodes";

/**
 * The interviewer's half of the question, rendered as a live-reference panel.
 *
 * Deliberately a server component with no state. The checklist below it is ticked
 * during a session; this is read before one and glanced at during it, and adding
 * collapse state would put the fact you need behind a click at the moment you need
 * it. The one exception is `ground_truth`, which is a genuine spoiler — that gets
 * a <details>, which needs no JavaScript.
 */

const RELEASE: Record<Release, { label: string; glyph: string; className: string }> = {
  stated: {
    label: "say it",
    glyph: "●",
    className: "border-ink-600 bg-ink-800 text-ink-100",
  },
  on_request: {
    label: "if asked",
    glyph: "◐",
    className: "border-live-600/40 bg-live-600/10 text-live-400",
  },
  on_earned_ask: {
    label: "only if asked precisely",
    glyph: "◔",
    className: "border-warn-400/35 bg-warn-400/[0.07] text-warn-400",
  },
  withheld: {
    label: "hold",
    glyph: "○",
    className: "border-warn-400/50 bg-warn-400/[0.12] text-warn-400",
  },
};

/** Ordered loosest-to-tightest so the panel reads as a release ladder. */
const ORDER: Release[] = ["stated", "on_request", "on_earned_ask", "withheld"];

function Heading({ children, tone }: { children: React.ReactNode; tone?: "warn" }) {
  return (
    <h3
      className={`mb-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
        tone === "warn" ? "text-warn-400" : "text-ink-400"
      }`}
    >
      {children}
    </h3>
  );
}

export function SituationBriefPanel({
  brief,
  linker: L,
}: {
  brief: SituationBrief;
  linker: (text: string) => React.ReactNode;
}) {
  const facts = ORDER.flatMap((r) => brief.facts.filter((f) => f.release === r));

  return (
    <section className="rounded-xl border border-ink-800 bg-ink-900/70">
      <header className="border-b border-ink-800 px-4 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">
          Situation brief
        </h2>
        <p className="mt-0.5 text-xs text-ink-400">
          What you hold that they don&rsquo;t.{" "}
          <Link
            href={"/interviewer/running-a-session#information" as Route}
            className="text-live-400 underline-offset-2 hover:underline"
          >
            Why it matters
          </Link>
        </p>
      </header>

      <div className="space-y-5 p-4">
        <p className="text-[13.5px] leading-relaxed text-ink-300">{L(brief.premise)}</p>

        <div>
          <Heading>What you know</Heading>
          <ul className="space-y-2">
            {facts.map((f) => {
              const r = RELEASE[f.release];
              return (
                <li key={f.fact} className="rounded-lg border border-ink-800 bg-ink-950/40 p-2.5">
                  {/*
                    The badge sits above the fact rather than beside it. Inline, the
                    longest label ("only if asked precisely") eats half of a 380px
                    rail and squeezes the fact into a four-word column.
                  */}
                  <span
                    className={`mb-1.5 inline-block rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide ${r.className}`}
                  >
                    <span aria-hidden className="mr-1">
                      {r.glyph}
                    </span>
                    {r.label}
                  </span>
                  {f.asks && (
                    <p className="mb-0.5 text-[12px] leading-snug text-ink-400">
                      &ldquo;{f.asks}&rdquo;
                    </p>
                  )}
                  <p className="mb-1 text-[13px] leading-snug text-ink-100">{L(f.fact)}</p>
                  {f.why && (
                    <p className="border-l-2 border-ink-700 pl-2 text-[11.5px] leading-relaxed text-ink-400">
                      {L(f.why)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {brief.open.length > 0 && (
          <div>
            <Heading>Deliberately open</Heading>
            <p className="mb-2 text-[11.5px] leading-relaxed text-ink-400">
              They must assume. Do not resolve these, even asked directly.
            </p>
            <ul className="space-y-2">
              {brief.open.map((o) => (
                <li key={o.unknown} className="rounded-lg border border-ink-800 bg-ink-950/40 p-2.5">
                  {o.asks && (
                    <p className="mb-0.5 text-[12px] leading-snug text-ink-400">
                      &ldquo;{o.asks}&rdquo;
                    </p>
                  )}
                  <p className="text-[13px] leading-snug text-ink-100">{L(o.unknown)}</p>
                  <dl className="mt-1.5 space-y-1 text-[11.5px] leading-relaxed">
                    <div>
                      <dt className="inline font-mono uppercase tracking-wide text-live-400">
                        reasonable ·{" "}
                      </dt>
                      <dd className="inline text-ink-300">{L(o.reasonable)}</dd>
                    </div>
                    <div>
                      <dt className="inline font-mono uppercase tracking-wide text-ink-400">
                        why open ·{" "}
                      </dt>
                      <dd className="inline text-ink-400">{L(o.why_open)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <Heading>What the question turns on</Heading>
          <ol className="space-y-2">
            {brief.keys.map((k, i) => (
              <li
                key={k.insight}
                className="rounded-lg border border-live-600/25 bg-live-600/[0.04] p-2.5"
              >
                <div className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-px shrink-0 font-mono text-[11px] tabular-nums text-live-400"
                  >
                    {i + 1}
                  </span>
                  <p className="min-w-0 text-[13px] leading-snug text-ink-100">{L(k.insight)}</p>
                </div>
                <dl className="mt-1.5 space-y-1 pl-[18px] text-[11.5px] leading-relaxed">
                  <div>
                    <dt className="inline font-mono uppercase tracking-wide text-live-400">
                      unlocked by ·{" "}
                    </dt>
                    <dd className="inline text-ink-300">{L(k.unlocked_by)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-mono uppercase tracking-wide text-warn-400">
                      if missed ·{" "}
                    </dt>
                    <dd className="inline text-ink-400">{L(k.if_missed)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </div>

        {brief.ground_truth && (
          <details className="group rounded-lg border border-warn-400/30 bg-warn-400/[0.04]">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-warn-400 marker:content-none">
              <span aria-hidden className="mr-1.5 inline-block transition-transform group-open:rotate-90">
                ▸
              </span>
              What is actually going on — spoiler
            </summary>
            <p className="border-t border-warn-400/20 px-3 py-2.5 text-[13px] leading-relaxed text-ink-300">
              {L(brief.ground_truth)}
            </p>
          </details>
        )}
      </div>
    </section>
  );
}
