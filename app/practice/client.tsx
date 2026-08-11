"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  buildScenario,
  needsUserContext,
  type PracticeData,
  type Selection,
} from "@/src/practice/model";
import { Nav } from "../nav";
import { Chip, Panel, Segmented } from "../ui";

const SESSION_LENGTHS = [10, 15, 25, 40];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Practice({ data }: { data: PracticeData }) {
  const [sel, setSel] = useState<Selection>({
    questionTypeId: data.questionTypes[0]?.id ?? "",
    lensId: data.lenses[0]?.id ?? null,
    archetypeId: data.archetypes[0]?.id ?? null,
    situationId: data.archetypes[0]?.typical_situations[0] ?? null,
    promptIndex: 0,
    sessionMinutes: 25,
  });

  const q = data.questionTypes.find((x) => x.id === sel.questionTypeId);
  const scenario = useMemo(() => buildScenario(data, sel), [data, sel]);

  const archetype = data.archetypes.find((a) => a.id === sel.archetypeId);
  const contextSituations = useMemo(
    () =>
      (archetype?.typical_situations ?? [])
        .map((id) => data.situations.find((s) => s.id === id))
        .filter((s): s is (typeof data.situations)[number] => Boolean(s)),
    [archetype, data.situations]
  );

  const set = (patch: Partial<Selection>) => setSel((s) => ({ ...s, ...patch }));

  /** Randomise only on click — doing it during render would break hydration. */
  const shuffle = () => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
    const nextQ = pick(data.questionTypes);
    const nextArchetype = pick(data.archetypes);
    setSel((s) => ({
      ...s,
      questionTypeId: nextQ.id,
      lensId: pick(data.lenses).id,
      archetypeId: nextArchetype.id,
      situationId: pick(nextArchetype.typical_situations),
      promptIndex: Math.floor(Math.random() * 8),
    }));
    reset();
  };

  /* ---------------------------------------------------------------- timer */
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startedAt.current !== null) {
        setElapsed(Math.floor((performance.now() - startedAt.current) / 1000));
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    startedAt.current = performance.now() - elapsed * 1000;
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    startedAt.current = null;
  };

  const currentStageIndex = scenario
    ? scenario.stages.findIndex((s) => elapsed < s.cumulativeSec)
    : -1;
  const overrun = scenario ? elapsed - scenario.totalSec : 0;

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (!q || !scenario) return null;

  return (
    <main className="mx-auto max-w-[1150px] px-6 py-8">
      <Nav crumb={{ label: "Practice" }} />

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-xl font-semibold tracking-tight text-ink-100">Practice session</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-400">
            A real prompt, timed to the stage weights of the company you picked — not to the
            framework&apos;s own defaults. CIRCLES allots 15% of an answer to Identify; Meta
            weights it 30%. Practising to the framework underspends the stage that carries the
            points.
          </p>
        </div>
        <button
          type="button"
          onClick={shuffle}
          className="rounded-lg border border-ink-600 bg-ink-800 px-4 py-2 text-sm font-medium text-ink-100 transition-colors hover:bg-ink-700"
        >
          ⟳ New scenario
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.75fr)_1.25fr]">
        {/* ------------------------------------------------------ setup */}
        <div className="flex flex-col gap-5">
          <Panel title="Scenario" subtitle="What you are practising, and for whom.">
            <div className="flex flex-col gap-3">
              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                  question type
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.questionTypes.map((t) => (
                    <Chip
                      key={t.id}
                      active={t.id === sel.questionTypeId}
                      onClick={() => {
                        set({ questionTypeId: t.id, promptIndex: 0 });
                        reset();
                      }}
                    >
                      {t.name}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                  company
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.lenses.map((l) => (
                    <Chip
                      key={l.id}
                      active={l.id === sel.lensId}
                      onClick={() => set({ lensId: l.id })}
                    >
                      {l.company}
                    </Chip>
                  ))}
                </div>
              </div>

              {needsUserContext(q.family) && (
                <>
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      user
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.archetypes.map((a) => (
                        <Chip
                          key={a.id}
                          active={a.id === sel.archetypeId}
                          onClick={() =>
                            set({ archetypeId: a.id, situationId: a.typical_situations[0] ?? null })
                          }
                        >
                          {a.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                      moment
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {contextSituations.map((s) => (
                        <Chip
                          key={s.id}
                          active={s.id === sel.situationId}
                          title={s.narrative}
                          onClick={() => set({ situationId: s.id })}
                        >
                          {s.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Segmented
                label="length"
                hint="minutes"
                value={sel.sessionMinutes}
                options={SESSION_LENGTHS.map((m) => ({ value: m, label: `${m}m` }))}
                onChange={(m) => {
                  set({ sessionMinutes: m });
                  reset();
                }}
              />
            </div>
          </Panel>

          {scenario.liveHeuristics.length > 0 && (
            <Panel
              title="Heuristics in play"
              subtitle="Fire for this user in this moment — cite them by name."
            >
              <div className="flex flex-col gap-2">
                {scenario.liveHeuristics.map((h) => (
                  <Link
                    key={h.id}
                    href={`/heuristic/${h.id}`}
                    className="rounded-lg border border-ink-800 bg-ink-850/50 p-2.5 transition-colors hover:border-ink-600"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 shrink-0 rounded-full bg-live-400" />
                      <span className="text-[13px] font-medium text-ink-100">{h.name}</span>
                    </div>
                    <p className="mt-0.5 pl-3.5 font-mono text-[10px] text-live-400/70">{h.why}</p>
                  </Link>
                ))}
              </div>
              {scenario.tensions.length > 0 && (
                <div className="mt-3 border-t border-ink-800 pt-3">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-tension-400">
                    resolve out loud
                  </div>
                  {scenario.tensions.map((t) => (
                    <p key={t.aName + t.bName} className="mb-1 text-[12px] leading-relaxed text-ink-300">
                      <span className="text-ink-100">
                        {t.aName} ↔ {t.bName}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {scenario.conceptRefs.length > 0 && (
            <Panel title="Review after" subtitle="Assumed knowledge for this question type.">
              <div className="flex flex-wrap gap-1.5">
                {scenario.conceptRefs.map((c) => (
                  <Link
                    key={c.id}
                    href={`/concept/${c.id}`}
                    className="rounded-full border border-ink-800 bg-ink-850 px-3 py-1.5 text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </Panel>
          )}
        </div>

        {/* ------------------------------------------------------ session */}
        <div className="flex flex-col gap-5">
          <section className="rounded-xl border border-ink-700 bg-ink-900 p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-400">
              your prompt
            </div>
            <p className="text-lg leading-relaxed text-ink-100">&ldquo;{scenario.prompt}&rdquo;</p>
            {scenario.contextLine && (
              <p className="mt-3 border-t border-ink-800 pt-3 font-mono text-[11px] leading-relaxed text-ink-400">
                {scenario.contextLine}
              </p>
            )}
            <button
              type="button"
              onClick={() => set({ promptIndex: sel.promptIndex + 1 })}
              className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink-400 underline decoration-ink-700 underline-offset-4 hover:text-ink-200"
            >
              different prompt →
            </button>
          </section>

          <Panel
            title={scenario.framework ? `Scaffold · ${scenario.framework.name}` : "Scaffold"}
            subtitle={
              sel.lensId
                ? "Time allocated by this company's rubric weights, not the framework default."
                : "Time allocated by the framework's own defaults."
            }
            right={
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-sm tabular-nums ${
                    overrun > 0 ? "text-warn-400" : "text-ink-100"
                  }`}
                >
                  {fmt(elapsed)}
                  <span className="text-ink-600"> / {fmt(scenario.totalSec)}</span>
                </span>
                <button
                  type="button"
                  onClick={running ? pause : start}
                  className="rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1 text-xs text-ink-100 hover:bg-ink-700"
                >
                  {running ? "Pause" : elapsed ? "Resume" : "Start"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md border border-ink-800 px-2.5 py-1 text-xs text-ink-400 hover:text-ink-100"
                >
                  Reset
                </button>
              </div>
            }
          >
            <ol className="flex flex-col gap-1.5">
              {scenario.stages.map((s, i) => {
                const isCurrent = running && i === currentStageIndex;
                const isDone = elapsed >= s.cumulativeSec;
                return (
                  <li
                    key={s.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      isCurrent
                        ? "border-live-600/60 bg-live-600/[0.07]"
                        : isDone && elapsed > 0
                          ? "border-ink-800 bg-ink-900/40 opacity-60"
                          : "border-ink-800 bg-ink-850/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[14px] font-medium text-ink-100">
                        {i + 1}. {s.name}
                      </span>
                      <span className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                        <span className="text-ink-300">{fmt(s.targetSec)}</span>
                        <span className="text-ink-600">{s.pct}%</span>
                        {s.divergence !== 0 && (
                          <span className={s.divergence > 0 ? "text-live-400" : "text-ink-400"}>
                            {s.divergence > 0 ? "▲" : "▼"}
                            {Math.abs(s.divergence)}
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-400">{s.prompt}</p>
                  </li>
                );
              })}
            </ol>
            {scenario.stages.some((s) => s.divergence !== 0) && (
              <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-400">
                ▲▼ shows how far this company&apos;s weighting moves a stage away from the
                framework&apos;s default share. The green ones are where the points are.
              </p>
            )}
            {overrun > 0 && (
              <p className="mt-3 text-[13px] text-warn-400">
                {fmt(overrun)} over. In a real loop the interviewer would have moved you on —
                note which stage ran long.
              </p>
            )}
          </Panel>

          <Panel
            title="Self-check"
            subtitle="Run this after you answer, out loud, before reading anything else."
            right={
              <span className="font-mono text-xs text-ink-400">
                {Object.values(checked).filter(Boolean).length}/{scenario.checks.length}
              </span>
            }
          >
            <ul className="flex flex-col gap-1.5">
              {scenario.checks.map((c) => (
                <li key={c.text}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-2 hover:bg-ink-850/60">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[c.text])}
                      onChange={(e) => setChecked((p) => ({ ...p, [c.text]: e.target.checked }))}
                      className="mt-0.5 size-4 shrink-0 accent-emerald-500"
                    />
                    <span className="min-w-0">
                      <span className="text-[13px] leading-relaxed text-ink-300">{c.text}</span>
                      <span className="ml-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-600">
                        {c.source}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </main>
  );
}
