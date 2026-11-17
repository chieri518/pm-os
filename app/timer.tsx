"use client";

import { useEffect, useRef, useState } from "react";

const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * A session clock. The interviewer's copy shows the guide's pacing checkpoints; the
 * candidate's copy shows only the total, because knowing where you "should" be
 * would change the exercise.
 *
 * Time is computed from a start timestamp rather than counted in ticks, so a
 * backgrounded tab that throttles its interval still shows the right time.
 */
export function SessionTimer({
  minutes,
  checkpoints = [],
  large = false,
}: {
  minutes: number;
  checkpoints?: { at_min: number; expect: string }[];
  large?: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const banked = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (startedAt.current !== null) {
        setElapsed(banked.current + (Date.now() - startedAt.current) / 1000);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const start = () => {
    startedAt.current = Date.now();
    setRunning(true);
  };
  const pause = () => {
    if (startedAt.current !== null) banked.current += (Date.now() - startedAt.current) / 1000;
    startedAt.current = null;
    setElapsed(banked.current);
    setRunning(false);
  };
  const reset = () => {
    startedAt.current = null;
    banked.current = 0;
    setElapsed(0);
    setRunning(false);
  };

  const total = minutes * 60;
  const over = elapsed > total;
  const pct = Math.min(100, (elapsed / total) * 100);
  const next = checkpoints.find((c) => c.at_min * 60 > elapsed);
  const passed = [...checkpoints].reverse().find((c) => c.at_min * 60 <= elapsed);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`font-mono tabular-nums ${large ? "text-[40px] leading-none" : "text-[22px] leading-none"} ${
            over ? "text-warn-400" : "text-ink-100"
          }`}
          aria-live="off"
        >
          {fmt(elapsed)}
        </span>
        <span className="font-mono text-[12px] text-ink-400">
          {over ? `${fmt(elapsed - total)} over` : `of ${minutes}:00`}
        </span>
        <div className="ml-auto flex gap-1.5">
          {running ? (
            <button
              type="button"
              onClick={pause}
              className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 text-[13px] text-ink-100 hover:border-ink-600"
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className="rounded-lg border border-live-600/50 bg-live-600/10 px-3 py-1.5 text-[13px] font-medium text-live-400 hover:bg-live-600/20"
            >
              {elapsed > 0 ? "Resume" : "Start"}
            </button>
          )}
          {elapsed > 0 && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-ink-800 px-3 py-1.5 text-[13px] text-ink-400 hover:text-ink-100"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-800" aria-hidden>
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${over ? "bg-warn-400" : "bg-live-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {checkpoints.length > 0 && (
        <div className="mt-3 grid gap-1 text-[13px] leading-snug">
          {passed && (
            <p className="text-ink-300">
              <span className="mr-2 font-mono text-[11px] text-ink-400">by {passed.at_min}m</span>
              {passed.expect}
            </p>
          )}
          {next && (
            <p className="text-ink-400">
              <span className="mr-2 font-mono text-[11px] text-ink-600">next {next.at_min}m</span>
              {next.expect}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
