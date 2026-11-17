"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { decodeDebrief, signalKey, type DebriefPayload } from "@/src/practice/debrief-code";

interface Props {
  guideId: string;
  question: string;
  questionType: { href: string; name: string } | null;
  signalGroups: { dimension: string; signals: string[] }[];
  antiSignals: string[];
  plusLines: string[];
  deltaLines: string[];
  mostCommon: string;
  notTested: string[];
  study: { href: string; name: string; line: string }[];
  next: { href: string; question: string; covers: string[] }[];
}

const H2 = ({ children, tone }: { children: React.ReactNode; tone?: "plus" | "delta" }) => (
  <h2
    className={`mb-2 font-mono text-[11px] uppercase tracking-wider ${
      tone === "plus" ? "text-live-400" : tone === "delta" ? "text-warn-400" : "text-ink-300"
    }`}
  >
    {children}
  </h2>
);

/**
 * Renders the debrief carried in the link's fragment. The fragment never reaches a
 * server, so this is the only place the debrief exists outside the interviewer's
 * clipboard.
 */
export function DebriefView(p: Props) {
  // undefined = not read yet (first render, identical on server and client);
  // null = no valid debrief in the link.
  const [data, setData] = useState<DebriefPayload | null | undefined>(undefined);

  useEffect(() => {
    const read = () => setData(decodeDebrief(window.location.hash.slice(1)));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  if (data === undefined) {
    return <p className="text-[14px] text-ink-400">Opening your debrief…</p>;
  }

  if (data === null) {
    return (
      <div className="max-w-xl">
        <h1 className="text-[24px] font-semibold tracking-tight text-ink-100">No debrief in this link</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-300">
          This page shows a debrief your mock-interview partner sends you, and the debrief travels
          inside the link itself. Ask them to copy the debrief link again from the interviewer guide
          and send the whole thing — it is usually long.
        </p>
        <p className="mt-4 text-[14px]">
          <Link href={`/practice/${p.guideId}` as Route} className="text-live-400 underline-offset-2 hover:underline">
            Back to the question →
          </Link>
        </p>
      </div>
    );
  }

  const seen = new Set(data.s);
  const observed = p.signalGroups
    .map((g, gi) => ({
      dimension: g.dimension,
      hit: g.signals.filter((_, si) => seen.has(signalKey(gi, si))),
      missed: g.signals.filter((_, si) => !seen.has(signalKey(gi, si))),
    }));
  const hits = observed.flatMap((o) => o.hit);
  const plus = data.p.map((i) => p.plusLines[i]).filter((x): x is string => Boolean(x));
  const delta = data.d.map((i) => p.deltaLines[i]).filter((x): x is string => Boolean(x));
  const anti = data.a.map((i) => p.antiSignals[i]).filter((x): x is string => Boolean(x));
  const missedCount = observed.reduce((n, o) => n + o.missed.length, 0);

  return (
    <article>
      <header className="mb-7">
        <p className="font-mono text-[10px] uppercase tracking-wider text-live-400">Your debrief</p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-ink-100 [text-wrap:balance]">
          {p.question}
        </h1>
        <p className="mt-2 text-[13px] text-ink-400">
          {hits.length} of {hits.length + missedCount} scored signals observed.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-live-600/30 bg-live-600/[0.05] p-4">
          <H2 tone="plus">Plus · keep doing</H2>
          {data.pn && <p className="mb-3 text-[15px] leading-relaxed text-ink-100">{data.pn}</p>}
          {plus.length > 0 && (
            <ul className="mb-3 space-y-1.5">
              {plus.map((x) => (
                <li key={x} className="text-[14px] leading-relaxed text-ink-300">“{x}”</li>
              ))}
            </ul>
          )}
          {observed.some((o) => o.hit.length) ? (
            <div className="space-y-2.5">
              {observed
                .filter((o) => o.hit.length)
                .map((o) => (
                  <div key={o.dimension}>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">{o.dimension}</div>
                    <ul className="mt-1 space-y-1">
                      {o.hit.map((x) => (
                        <li key={x} className="flex gap-2 text-[13.5px] leading-snug text-ink-300">
                          <span aria-hidden className="text-live-400">✓</span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          ) : (
            !data.pn && plus.length === 0 && <p className="text-[13.5px] text-ink-400">Nothing recorded.</p>
          )}
        </section>

        <section className="rounded-xl border border-warn-400/30 bg-warn-400/[0.04] p-4">
          <H2 tone="delta">Delta · change next time</H2>
          {data.dn && <p className="mb-3 text-[15px] leading-relaxed text-ink-100">{data.dn}</p>}
          {delta.length > 0 && (
            <ul className="mb-3 space-y-1.5">
              {delta.map((x) => (
                <li key={x} className="text-[14px] leading-relaxed text-ink-300">“{x}”</li>
              ))}
            </ul>
          )}
          {anti.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">Your partner noticed</div>
              <ul className="mt-1 space-y-1">
                {anti.map((x) => (
                  <li key={x} className="flex gap-2 text-[13.5px] leading-snug text-ink-300">
                    <span aria-hidden className="text-warn-400">✕</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!data.dn && delta.length === 0 && anti.length === 0 && (
            <p className="text-[13.5px] text-ink-400">Nothing recorded.</p>
          )}
        </section>
      </div>

      <p className="mt-4 border-l-2 border-ink-600 pl-3 text-[14px] leading-relaxed text-ink-100">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-ink-400">Most common note ·</span>
        {p.mostCommon}
      </p>

      {missedCount > 0 && (
        <details className="mt-6 rounded-xl border border-ink-800 bg-ink-900/70 p-4">
          <summary className="cursor-pointer text-[14px] text-ink-100">
            Not observed this time <span className="font-mono text-[11px] text-ink-400">{missedCount}</span>
          </summary>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-400">
            What earns the score on this question. Not seeing something is not the same as you not
            doing it, but these are the behaviours to make visible next time.
          </p>
          <div className="mt-3 space-y-2.5">
            {observed
              .filter((o) => o.missed.length)
              .map((o) => (
                <div key={o.dimension}>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">{o.dimension}</div>
                  <ul className="mt-1 space-y-1">
                    {o.missed.map((x) => (
                      <li key={x} className="flex gap-2 text-[13.5px] leading-snug text-ink-300">
                        <span aria-hidden className="text-ink-600">○</span>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </details>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {p.study.length > 0 && (
          <section>
            <H2>Study next</H2>
            <ul className="space-y-2.5">
              {p.study.map((c) => (
                <li key={c.href}>
                  <Link href={c.href as Route} className="text-[14.5px] text-ink-100 underline decoration-ink-600 underline-offset-4 hover:decoration-ink-400">
                    {c.name}
                  </Link>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-400">{c.line}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {p.next.length > 0 && (
          <section>
            <H2>Run next</H2>
            {p.notTested.length > 0 && (
              <p className="mb-2.5 text-[13px] leading-relaxed text-ink-400">
                This question could not show {p.notTested.join(", ").toLowerCase()}. These can:
              </p>
            )}
            <ul className="space-y-2.5">
              {p.next.map((n) => (
                <li key={n.href}>
                  <Link href={n.href as Route} className="text-[14.5px] text-ink-100 underline decoration-ink-600 underline-offset-4 hover:decoration-ink-400">
                    {n.question}
                  </Link>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">{n.covers.join(" · ")}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <p className="mt-8 text-[12px] leading-relaxed text-ink-400">
        This debrief exists only in the link you were sent. Nothing about it is stored on pm-os.
        Bookmark the page or keep the message to come back to it.
        {p.questionType && (
          <>
            {" "}
            <Link href={p.questionType.href as Route} className="text-live-400 underline-offset-2 hover:underline">
              What gets scored in {p.questionType.name} →
            </Link>
          </>
        )}
      </p>
    </article>
  );
}
