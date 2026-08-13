"use client";

import { useMemo, useState } from "react";

interface Group {
  dimension: string;
  signals: { observable: string; note?: string }[];
}

/**
 * Tickable rather than static, because this is meant to be open on a second screen
 * during a live session. State is deliberately in-memory only: an interviewer uses
 * it once, and persisting half-finished assessments of named candidates is a
 * privacy liability nobody asked for.
 */
export function SignalChecklist({
  groups,
  antiSignals,
}: {
  groups: Group[];
  antiSignals: { observable: string; note?: string }[];
}) {
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const total = useMemo(() => groups.reduce((n, g) => n + g.signals.length, 0), [groups]);

  const positives = [...ticked].filter((k) => !k.startsWith("anti:")).length;
  const negatives = [...ticked].filter((k) => k.startsWith("anti:")).length;

  const toggle = (key: string) =>
    setTicked((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const Row = ({ id, text, note, bad }: { id: string; text: string; note?: string; bad?: boolean }) => {
    const on = ticked.has(id);
    return (
      <li>
        <button
          type="button"
          onClick={() => toggle(id)}
          aria-pressed={on}
          className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
            on ? (bad ? "bg-warn-400/10" : "bg-live-600/10") : "hover:bg-ink-850"
          }`}
        >
          <span
            aria-hidden
            className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border font-mono text-[10px] ${
              on
                ? bad
                  ? "border-warn-400 bg-warn-400/20 text-warn-400"
                  : "border-live-400 bg-live-600/20 text-live-400"
                : "border-ink-600 text-transparent"
            }`}
          >
            {bad ? "✕" : "✓"}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block text-[13px] leading-snug ${on ? "text-ink-100" : "text-ink-300"}`}
            >
              {text}
            </span>
            {note && (
              <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-400">{note}</span>
            )}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900/70">
      <header className="flex items-baseline justify-between gap-3 border-b border-ink-800 px-4 py-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">
            Signal checklist
          </h2>
          <p className="mt-0.5 text-xs text-ink-400">Tick what you actually observed.</p>
        </div>
        <div className="shrink-0 text-right font-mono text-xs">
          <span className="text-live-400">{positives}</span>
          <span className="text-ink-600">/{total}</span>
          {negatives > 0 && <span className="ml-2 text-warn-400">✕{negatives}</span>}
        </div>
      </header>

      <div className="max-h-[70vh] overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g.dimension} className="mb-4 last:mb-0">
            <div className="mb-1 px-2 font-mono text-[10px] uppercase tracking-wider text-ink-400">
              {g.dimension}
            </div>
            <ul className="space-y-0.5">
              {g.signals.map((s) => (
                <Row key={s.observable} id={s.observable} text={s.observable} note={s.note} />
              ))}
            </ul>
          </div>
        ))}

        {antiSignals.length > 0 && (
          <div className="mt-4 border-t border-ink-800 pt-3">
            <div className="mb-1 px-2 font-mono text-[10px] uppercase tracking-wider text-warn-400">
              Anti-signals
            </div>
            <ul className="space-y-0.5">
              {antiSignals.map((s) => (
                <Row
                  key={s.observable}
                  id={`anti:${s.observable}`}
                  text={s.observable}
                  note={s.note}
                  bad
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {ticked.size > 0 && (
        <footer className="border-t border-ink-800 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setTicked(new Set())}
            className="font-mono text-[11px] text-ink-400 hover:text-ink-100"
          >
            reset
          </button>
        </footer>
      )}
    </div>
  );
}
