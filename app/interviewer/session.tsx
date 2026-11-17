"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { CopyButton } from "../copy-button";
import { SessionTimer } from "../timer";
import { antiKey, encodeDebrief, signalKey } from "@/src/practice/debrief-code";

/*
 * One mock interview, held in memory on the interviewer's screen.
 *
 * The checklist (right rail) and the debrief builder (main column) share this
 * state, so what you ticked during the session is already in the debrief at the
 * end. Nothing is persisted: an interviewer uses it once, and storing assessments
 * of named people is a liability nobody asked for. The debrief leaves this page
 * only as a link the interviewer chooses to send.
 */

interface Ctx {
  ticked: Set<string>;
  toggle: (key: string) => void;
  resetTicks: () => void;
  plus: Set<number>;
  delta: Set<number>;
  togglePlus: (i: number) => void;
  toggleDelta: (i: number) => void;
  plusNote: string;
  deltaNote: string;
  setPlusNote: (s: string) => void;
  setDeltaNote: (s: string) => void;
}

const SessionCtx = createContext<Ctx | null>(null);

export function useSession(): Ctx {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("useSession outside <MockSession>");
  return c;
}

const flip = <T,>(s: Set<T>, v: T) => {
  const next = new Set(s);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
};

export function MockSession({ children }: { children: ReactNode }) {
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [plus, setPlus] = useState<Set<number>>(new Set());
  const [delta, setDelta] = useState<Set<number>>(new Set());
  const [plusNote, setPlusNote] = useState("");
  const [deltaNote, setDeltaNote] = useState("");

  return (
    <SessionCtx.Provider
      value={{
        ticked,
        toggle: (k) => setTicked((s) => flip(s, k)),
        resetTicks: () => setTicked(new Set()),
        plus,
        delta,
        togglePlus: (i) => setPlus((s) => flip(s, i)),
        toggleDelta: (i) => setDelta((s) => flip(s, i)),
        plusNote,
        deltaNote,
        setPlusNote,
        setDeltaNote,
      }}
    >
      {children}
    </SessionCtx.Provider>
  );
}

/* ------------------------------------------------------------- top bar */

export function SessionBar({
  guideId,
  minutes,
  checkpoints,
}: {
  guideId: string;
  minutes: number;
  checkpoints: { at_min: number; expect: string }[];
}) {
  return (
    <section
      aria-label="Run this as a mock interview"
      className="mb-7 grid gap-4 rounded-xl border border-ink-800 bg-ink-900/70 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
    >
      <div className="min-w-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">
          Run it as a mock
        </h2>
        <ol className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-ink-300">
          <li>
            <span className="mr-1.5 font-mono text-[11px] text-ink-400">1</span>
            Send your partner their link. They see the prompt and a clock, nothing else.
          </li>
          <li>
            <span className="mr-1.5 font-mono text-[11px] text-ink-400">2</span>
            Start the clock when you finish reading the prompt. Tick signals as you see them.
          </li>
          <li>
            <span className="mr-1.5 font-mono text-[11px] text-ink-400">3</span>
            Build the debrief at the end and send it. They keep it.
          </li>
        </ol>
        <div className="mt-3 flex flex-wrap items-start gap-2">
          <CopyButton
            primary
            label="Copy candidate link"
            getText={() => `${window.location.origin}/practice/${guideId}`}
          />
          <a
            href="#debrief"
            className="rounded-lg border border-ink-800 px-3 py-1.5 text-[13px] text-ink-400 hover:text-ink-100"
          >
            Jump to debrief ↓
          </a>
        </div>
      </div>
      <div className="min-w-0 rounded-lg border border-ink-800 bg-ink-950/60 p-3">
        <SessionTimer minutes={minutes} checkpoints={checkpoints} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------- debrief builder */

function Choice({
  on,
  onClick,
  text,
  tone,
}: {
  on: boolean;
  onClick: () => void;
  text: string;
  tone: "plus" | "delta";
}) {
  const onCls =
    tone === "plus"
      ? "border-live-400 bg-live-600/20 text-live-400"
      : "border-warn-400 bg-warn-400/20 text-warn-400";
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
          on ? (tone === "plus" ? "bg-live-600/10" : "bg-warn-400/10") : "hover:bg-ink-850"
        }`}
      >
        <span
          aria-hidden
          className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border font-mono text-[10px] ${
            on ? onCls : "border-ink-600 text-transparent"
          }`}
        >
          ✓
        </span>
        <span className={`text-[13.5px] leading-relaxed ${on ? "text-ink-100" : "text-ink-300"}`}>
          “{text}”
        </span>
      </button>
    </li>
  );
}

export function DebriefBuilder({
  guideId,
  question,
  plusLines,
  deltaLines,
  signalGroups,
  antiSignals,
  mostCommon,
}: {
  guideId: string;
  question: string;
  plusLines: string[];
  deltaLines: string[];
  signalGroups: { dimension: string; signals: { observable: string }[] }[];
  antiSignals: { observable: string }[];
  mostCommon: ReactNode;
}) {
  const s = useSession();

  const observed = signalGroups.flatMap((g, gi) =>
    g.signals.filter((_, si) => s.ticked.has(signalKey(gi, si))).map((x) => x.observable)
  );
  const antiSeen = antiSignals.filter((_, i) => s.ticked.has(antiKey(i))).map((x) => x.observable);

  const link = () => {
    const code = encodeDebrief({
      v: 1,
      s: [...s.ticked].filter((k) => !k.startsWith("a")),
      a: [...s.ticked].filter((k) => k.startsWith("a")).map((k) => Number(k.slice(1))),
      p: [...s.plus].sort((a, b) => a - b),
      d: [...s.delta].sort((a, b) => a - b),
      pn: s.plusNote,
      dn: s.deltaNote,
    });
    return `${window.location.origin}/practice/${guideId}/debrief#${code}`;
  };

  const asText = () => {
    const bullets = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
    const plus = [...observed, ...plusLines.filter((_, i) => s.plus.has(i)), s.plusNote.trim()].filter(Boolean);
    const delta = [...deltaLines.filter((_, i) => s.delta.has(i)), s.deltaNote.trim(), ...antiSeen.map((a) => `Watch for: ${a}`)].filter(Boolean);
    return [
      `Mock interview debrief: ${question}`,
      "",
      "Plus",
      plus.length ? bullets(plus) : "- (nothing recorded)",
      "",
      "Delta",
      delta.length ? bullets(delta) : "- (nothing recorded)",
      "",
      `Full debrief: ${link()}`,
    ].join("\n");
  };

  const empty = s.ticked.size === 0 && s.plus.size === 0 && s.delta.size === 0 && !s.plusNote.trim() && !s.deltaNote.trim();

  return (
    <div id="debrief" className="scroll-mt-6">
      <p className="mb-3 text-[13.5px] leading-relaxed text-ink-400">
        {observed.length > 0 ? (
          <>
            <span className="text-live-400">{observed.length} signals</span> from your checklist are
            already in the Plus column.
          </>
        ) : (
          "Signals you tick in the checklist are added to the Plus column automatically."
        )}{" "}
        Pick the lines that fit, add one of your own, then send it.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-live-600/30 bg-live-600/[0.05] p-3">
          <div className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-wider text-live-400">
            Plus
          </div>
          <ul className="space-y-0.5">
            {plusLines.map((x, i) => (
              <Choice key={x} text={x} on={s.plus.has(i)} onClick={() => s.togglePlus(i)} tone="plus" />
            ))}
          </ul>
          <label className="mt-2 block px-2">
            <span className="sr-only">Plus, in your own words</span>
            <textarea
              id={`plus-note-${guideId}`}
              value={s.plusNote}
              onChange={(e) => s.setPlusNote(e.target.value)}
              rows={2}
              maxLength={600}
              placeholder="In your own words — the moment that worked best"
              className="w-full resize-y rounded-md border border-ink-800 bg-ink-900 px-2.5 py-1.5 text-[13px] text-ink-100 placeholder:text-ink-400 focus:border-ink-600 focus:outline-none"
            />
          </label>
        </div>

        <div className="rounded-lg border border-warn-400/30 bg-warn-400/[0.04] p-3">
          <div className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-wider text-warn-400">
            Delta
          </div>
          <ul className="space-y-0.5">
            {deltaLines.map((x, i) => (
              <Choice key={x} text={x} on={s.delta.has(i)} onClick={() => s.toggleDelta(i)} tone="delta" />
            ))}
          </ul>
          <label className="mt-2 block px-2">
            <span className="sr-only">Delta, in your own words</span>
            <textarea
              id={`delta-note-${guideId}`}
              value={s.deltaNote}
              onChange={(e) => s.setDeltaNote(e.target.value)}
              rows={2}
              maxLength={600}
              placeholder="One specific change for next time"
              className="w-full resize-y rounded-md border border-ink-800 bg-ink-900 px-2.5 py-1.5 text-[13px] text-ink-100 placeholder:text-ink-400 focus:border-ink-600 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="mt-3 border-l-2 border-ink-600 pl-3 text-[14px] leading-relaxed text-ink-100">
        {mostCommon}
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-2">
        <CopyButton primary label="Copy debrief link" getText={link} />
        <CopyButton label="Copy as text" getText={asText} />
        {empty && (
          <span className="self-center text-[12px] text-ink-400">
            Nothing selected yet — the link will still work, it will just be short.
          </span>
        )}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-400">
        The debrief lives entirely in the link. Nothing is saved or sent anywhere until you paste it.
      </p>
    </div>
  );
}
