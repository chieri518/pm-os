"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import raw from "@/src/generated/graphview.json";

/*
 * The map used to open on the whole corpus at once — ninety-odd nodes, labels
 * colliding, and no question it could answer. It looked like the product and
 * worked like a screenshot.
 *
 * It now opens on one question type with only its neighbourhood drawn, every node
 * labelled, and a panel that says what each connection IS and why it exists. Click
 * a neighbour and it becomes the centre, so the map is something you walk rather
 * than something you look at. The whole-corpus view is still one click away.
 */

interface RawNode {
  id: string;
  type: string;
  label: string;
  href: string;
}
interface RawEdge {
  from: string;
  to: string;
  rel: string;
  why?: string;
}
const DATA = raw as { nodes: RawNode[]; edges: RawEdge[] };
const NODES = new Map(DATA.nodes.map((n) => [n.id, n]));

const TYPES = [
  { id: "question_type", label: "Questions", one: "Question type", color: "#f0abfc" },
  { id: "concept", label: "Concepts", one: "Concept", color: "#34d399" },
  { id: "framework", label: "Frameworks", one: "Framework", color: "#fbbf24" },
  { id: "heuristic", label: "Heuristics", one: "Heuristic", color: "#a78bfa" },
  { id: "company_lens", label: "Companies", one: "Company", color: "#fb7185" },
  { id: "term", label: "Terms", one: "Term", color: "#60a5fa" },
] as const;
const COLOR = Object.fromEntries(TYPES.map((t) => [t.id, t.color])) as Record<string, string>;
const TYPE_ONE = Object.fromEntries(TYPES.map((t) => [t.id, t.one])) as Record<string, string>;
const TYPE_ORDER = Object.fromEntries(TYPES.map((t, i) => [t.id, i])) as Record<string, number>;

/** How a relation reads from the focused node's side: [outbound, inbound]. */
const REL_PHRASE: Record<string, [string, string]> = {
  ANSWERED_WITH: ["Answered with", "Fits these questions"],
  REQUIRES: ["Assumes you know", "Needed for"],
  ASKED_BY: ["Weighted most by", "Weights these most"],
  TENSIONS_WITH: ["Conflicts with", "Conflicts with"],
  MENTIONS: ["Mentions", "Mentioned by"],
};
const phrase = (rel: string, outbound: boolean) =>
  REL_PHRASE[rel]?.[outbound ? 0 : 1] ?? rel.toLowerCase().replace(/_/g, " ");

const QUESTIONS = DATA.nodes.filter((n) => n.type === "question_type");
const DEFAULT_FOCUS = QUESTIONS.find((q) => q.id.endsWith(":product-design"))?.id ?? QUESTIONS[0]!.id;

const W = 1000;
const H = 700;
const CX = W / 2;
const CY = H / 2;
// The focus view is wider than the whole map: its labels sit beside the rings and
// need the horizontal room.
const FW = 1100;
const FCX = FW / 2;
const clip = (s: string) => (s.length > 26 ? `${s.slice(0, 25).trimEnd()}…` : s);

/* ------------------------------------------------------------ neighbourhood */

interface Link_ {
  other: string;
  rel: string;
  outbound: boolean;
  why?: string;
}

function neighbourhood(focus: string) {
  const links: Link_[] = [];
  for (const e of DATA.edges) {
    if (e.from === focus) links.push({ other: e.to, rel: e.rel, outbound: true, why: e.why });
    else if (e.to === focus) links.push({ other: e.from, rel: e.rel, outbound: false, why: e.why });
  }
  const authored = new Set(links.filter((l) => l.rel !== "MENTIONS").map((l) => l.other));
  // A pair that is both authored and mentioned is shown once, as the authored claim.
  const kept = links.filter((l) => l.rel !== "MENTIONS" || !authored.has(l.other));
  const byOrder = (a: string, b: string) => {
    const na = NODES.get(a)!;
    const nb = NODES.get(b)!;
    return (TYPE_ORDER[na.type] ?? 9) - (TYPE_ORDER[nb.type] ?? 9) || na.label.localeCompare(nb.label);
  };
  const inner = [...authored].filter((id) => NODES.has(id)).sort(byOrder);
  const outer = [...new Set(kept.filter((l) => l.rel === "MENTIONS").map((l) => l.other))]
    .filter((id) => NODES.has(id))
    .sort(byOrder);
  return { links: kept, inner, outer, authored };
}

interface Placed {
  id: string;
  x: number;
  y: number;
  angle: number;
  ring: "inner" | "outer";
}

/** Two concentric rings: authored relationships close in, prose mentions further out. */
function radial(inner: string[], outer: string[]): Placed[] {
  const r1 = outer.length ? 160 : 210;
  const r2 = 285;
  const ring = (ids: string[], r: number, offset: number, name: Placed["ring"]) =>
    ids.map((id, i) => {
      const angle = -Math.PI / 2 + ((i + offset) / ids.length) * Math.PI * 2;
      return { id, angle, ring: name, x: FCX + Math.cos(angle) * r * 1.15, y: CY + Math.sin(angle) * r };
    });
  return [...ring(inner, r1, 0, "inner"), ...ring(outer, r2, 0.5, "outer")];
}

/* ---------------------------------------------------------------- whole map */

interface Sim {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  deg: number;
  node: RawNode;
}

/**
 * A small force-directed layout, written out rather than pulled in. ~90 nodes is
 * far too small to justify a graph library. Deterministic seeding, so the same
 * corpus always draws the same map.
 */
function forceLayout(nodes: RawNode[], edges: RawEdge[]): Sim[] {
  const deg = new Map<string, number>();
  for (const e of edges) {
    deg.set(e.from, (deg.get(e.from) ?? 0) + 1);
    deg.set(e.to, (deg.get(e.to) ?? 0) + 1);
  }
  const sims: Sim[] = nodes.map((n, i) => {
    const t = TYPE_ORDER[n.type] ?? 0;
    const a = (t / TYPES.length) * Math.PI * 2;
    const r = 150 + ((i * 37) % 120);
    return {
      id: n.id,
      x: CX + Math.cos(a) * r + ((i * 53) % 40) - 20,
      y: CY + Math.sin(a) * r + ((i * 31) % 40) - 20,
      vx: 0,
      vy: 0,
      deg: deg.get(n.id) ?? 0,
      node: n,
    };
  });
  const byId = new Map(sims.map((s) => [s.id, s]));
  const links = edges
    .map((e) => ({ a: byId.get(e.from), b: byId.get(e.to) }))
    .filter((l): l is { a: Sim; b: Sim } => Boolean(l.a && l.b));

  for (let iter = 0; iter < 320; iter++) {
    const cool = 1 - iter / 320;
    for (let i = 0; i < sims.length; i++) {
      for (let j = i + 1; j < sims.length; j++) {
        const a = sims[i]!;
        const b = sims[j]!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = (i % 7) - 3;
          dy = (j % 7) - 3;
          d2 = 25;
        }
        const f = 2600 / d2;
        const d = Math.sqrt(d2);
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
    }
    for (const { a, b } of links) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 90) * 0.012;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f;
      b.vy -= (dy / d) * f;
    }
    for (const s of sims) {
      s.vx += (CX - s.x) * 0.004;
      s.vy += (CY - s.y) * 0.004;
      s.x += Math.max(-18, Math.min(18, s.vx)) * cool;
      s.y += Math.max(-18, Math.min(18, s.vy)) * cool;
      s.vx *= 0.82;
      s.vy *= 0.82;
    }
  }
  return sims;
}

/* -------------------------------------------------------------- component */

const nodeKeys = (go: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    go();
  }
};

export default function GraphClient() {
  const [mode, setMode] = useState<"focus" | "all">("focus");
  const [focus, setFocusRaw] = useState<string>(DEFAULT_FOCUS);
  const [trail, setTrail] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);

  // Deep links: /graph#concept:north-star-metric opens centred on that node.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id && NODES.has(id)) setFocusRaw(id);
  }, []);

  const goTo = useCallback(
    (id: string) => {
      if (!NODES.has(id)) return;
      if (id !== focus) setTrail((t) => [...t.slice(-7), focus]);
      setFocusRaw(id);
      setMode("focus");
      setHover(null);
      window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
    },
    [focus]
  );

  const back = () => {
    const prev = trail[trail.length - 1];
    if (!prev) return;
    setTrail((t) => t.slice(0, -1));
    setFocusRaw(prev);
    window.history.replaceState(null, "", `#${encodeURIComponent(prev)}`);
  };

  return (
    <div>
      {/* ------------------------------------------------ controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-ink-400">
          Start from
        </span>
        {QUESTIONS.map((q) => {
          const on = mode === "focus" && focus === q.id;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => goTo(q.id)}
              aria-pressed={on}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                on
                  ? "border-live-400/60 bg-live-400/10 text-ink-100"
                  : "border-ink-700 bg-ink-850 text-ink-300 hover:text-ink-100"
              }`}
            >
              {q.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMode(mode === "all" ? "focus" : "all")}
          aria-pressed={mode === "all"}
          className={`rounded-full border px-2.5 py-1 text-xs transition-colors sm:ml-auto ${
            mode === "all"
              ? "border-ink-400 bg-ink-800 text-ink-100"
              : "border-ink-700 bg-ink-900 text-ink-400 hover:text-ink-100"
          }`}
        >
          {mode === "all" ? "Back to focus" : "Whole map"}
        </button>
      </div>

      {mode === "focus" ? (
        <FocusView focus={focus} hover={hover} setHover={setHover} goTo={goTo} back={trail.length ? back : null} />
      ) : (
        <WholeMap goTo={goTo} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- focus view */

function FocusView({
  focus,
  hover,
  setHover,
  goTo,
  back,
}: {
  focus: string;
  hover: string | null;
  setHover: (id: string | null) => void;
  goTo: (id: string) => void;
  back: (() => void) | null;
}) {
  const node = NODES.get(focus)!;
  const { links, inner, outer, authored } = useMemo(() => neighbourhood(focus), [focus]);
  const placed = useMemo(() => radial(inner, outer), [inner, outer]);
  const small = outer.length > 14;

  // Group the panel by how the relationship reads from here, authored groups first.
  const groups = useMemo(() => {
    const m = new Map<string, Link_[]>();
    for (const l of links) {
      const k = phrase(l.rel, l.outbound);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(l);
    }
    return [...m.entries()].sort(
      ([, a], [, b]) => Number(a[0]!.rel === "MENTIONS") - Number(b[0]!.rel === "MENTIONS")
    );
  }, [links]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative self-start overflow-hidden rounded-xl border border-ink-800 bg-ink-950">
        <svg
          viewBox={`0 0 ${FW} ${H}`}
          className="block aspect-[11/7] w-full"
          role="group"
          aria-label={`${node.label} and its ${placed.length} connections`}
        >
          {/* ring guides */}
          {outer.length > 0 && (
            <ellipse cx={FCX} cy={CY} rx={285 * 1.15} ry={285} fill="none" stroke="#16181c" />
          )}
          <ellipse
            cx={FCX}
            cy={CY}
            rx={(outer.length ? 160 : 210) * 1.15}
            ry={outer.length ? 160 : 210}
            fill="none"
            stroke="#16181c"
          />

          {placed.map((p) => {
            const lit = hover === p.id;
            const isAuthored = authored.has(p.id);
            return (
              <line
                key={`l-${p.id}`}
                x1={FCX}
                y1={CY}
                x2={p.x}
                y2={p.y}
                stroke={lit ? "#34d399" : isAuthored ? "#363b44" : "#1c1f24"}
                strokeWidth={lit ? 1.6 : isAuthored ? 1.1 : 0.8}
                strokeDasharray={isAuthored ? undefined : "3 4"}
              />
            );
          })}

          {placed.map((p) => {
            const n = NODES.get(p.id)!;
            const cos = Math.cos(p.angle);
            const sin = Math.sin(p.angle);
            const r = p.ring === "inner" ? 8 : 6;
            const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
            const lx = p.x + cos * (r + 7);
            const ly = anchor === "middle" ? p.y + (sin < 0 ? -r - 8 : r + 16) : p.y + 4;
            const lit = hover === p.id;
            return (
              <g
                key={p.id}
                role="button"
                tabIndex={0}
                aria-label={`${TYPE_ONE[n.type] ?? n.type}: ${n.label}. Centre the map here.`}
                className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-live-400"
                onClick={() => goTo(p.id)}
                onKeyDown={nodeKeys(() => goTo(p.id))}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.id)}
                onBlur={() => setHover(null)}
              >
                <circle cx={p.x} cy={p.y} r={r + 10} fill="transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={lit ? r + 2 : r}
                  fill={COLOR[n.type] ?? "#7d858f"}
                  stroke="#0a0b0d"
                  strokeWidth={2}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  // On a phone the canvas renders at ~40% scale: inner labels grow to stay
                  // legible, outer ones hide, and the panel below lists them instead.
                  className={`pointer-events-none select-none ${
                    p.ring === "inner"
                      ? "text-[12.5px] max-sm:text-[22px]"
                      : `${small ? "text-[11px]" : "text-[12.5px]"} max-sm:hidden`
                  }`}
                  fill={lit ? "#e7eaee" : p.ring === "inner" ? "#a2aab4" : "#7d858f"}
                  fontWeight={lit ? 600 : 400}
                >
                  {clip(n.label)}
                </text>
                <title>{n.label}</title>
              </g>
            );
          })}

          {/* the centre */}
          <circle cx={FCX} cy={CY} r={18} fill={COLOR[node.type] ?? "#7d858f"} stroke="#0a0b0d" strokeWidth={3} />
          <text
            x={FCX}
            y={CY + 40}
            textAnchor="middle"
            fill="#e7eaee"
            fontWeight={600}
            className="pointer-events-none select-none text-[16px] max-sm:text-[26px]"
          >
            {node.label}
          </text>
          {placed.length === 0 && (
            <text x={FCX} y={CY + 64} textAnchor="middle" fill="#7d858f" fontSize={13}>
              Nothing else in the corpus links here yet.
            </text>
          )}
        </svg>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 font-mono text-[10px] text-ink-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-5 bg-ink-600" /> authored, with a reason
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t border-dashed border-ink-600" /> mentioned in prose
          </span>
        </div>
      </div>

      {/* ------------------------------------------------ panel */}
      <aside className="rounded-xl border border-ink-800 bg-ink-900/70 p-4 lg:max-h-[min(80vh,720px)] lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: COLOR[node.type] }}>
            {TYPE_ONE[node.type] ?? node.type}
          </span>
          {back && (
            <button
              type="button"
              onClick={back}
              className="font-mono text-[10px] uppercase tracking-wider text-ink-400 hover:text-ink-100"
            >
              ← back
            </button>
          )}
        </div>
        <h2 className="mt-1 text-[17px] font-medium leading-snug text-ink-100">{node.label}</h2>
        <Link
          href={node.href as Route}
          className="mt-1 inline-block text-[13px] text-live-400 underline-offset-2 hover:underline"
        >
          Open the page →
        </Link>

        {groups.length === 0 && (
          <p className="mt-4 text-[13px] text-ink-400">No connections yet.</p>
        )}

        {groups.map(([label, items]) => {
          const soft = items[0]!.rel === "MENTIONS";
          return (
            <section key={label} className="mt-5">
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                {label} <span className="text-ink-600">{items.length}</span>
              </h3>
              {soft ? (
                <div className="flex flex-wrap gap-1.5">
                  {items.map((l) => (
                    <NodeChip key={l.other + l.rel} id={l.other} goTo={goTo} setHover={setHover} />
                  ))}
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {items.map((l) => (
                    <li key={l.other + l.rel}>
                      <NodeChip id={l.other} goTo={goTo} setHover={setHover} />
                      {l.why && (
                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-300">{l.why}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </aside>
    </div>
  );
}

function NodeChip({
  id,
  goTo,
  setHover,
}: {
  id: string;
  goTo: (id: string) => void;
  setHover: (id: string | null) => void;
}) {
  const n = NODES.get(id);
  if (!n) return null;
  return (
    <button
      type="button"
      onClick={() => goTo(id)}
      onMouseEnter={() => setHover(id)}
      onMouseLeave={() => setHover(null)}
      className="inline-flex items-center gap-1.5 rounded-md border border-ink-800 bg-ink-850 px-2 py-0.5 text-left text-[13px] text-ink-100 transition-colors hover:border-ink-600"
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: COLOR[n.type] }} />
      {n.label}
    </button>
  );
}

/* --------------------------------------------------------------- whole map */

function WholeMap({ goTo }: { goTo: (id: string) => void }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<string | null>(null);

  const visibleNodes = useMemo(() => DATA.nodes.filter((n) => !hidden.has(n.type)), [hidden]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => DATA.edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to)),
    [visibleIds]
  );
  const sims = useMemo(() => forceLayout(visibleNodes, visibleEdges), [visibleNodes, visibleEdges]);
  const byId = useMemo(() => new Map(sims.map((s) => [s.id, s])), [sims]);

  const lit = useMemo(() => {
    if (!hover) return null;
    const set = new Set<string>([hover]);
    for (const e of visibleEdges) {
      if (e.from === hover) set.add(e.to);
      if (e.to === hover) set.add(e.from);
    }
    return set;
  }, [hover, visibleEdges]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TYPES.map((t) => {
          const off = hidden.has(t.id);
          const count = DATA.nodes.filter((n) => n.type === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={!off}
              onClick={() =>
                setHidden((h) => {
                  const next = new Set(h);
                  if (next.has(t.id)) next.delete(t.id);
                  else next.add(t.id);
                  return next;
                })
              }
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                off ? "border-ink-800 bg-ink-900 text-ink-600" : "border-ink-700 bg-ink-850 text-ink-200"
              }`}
            >
              <span className="size-2 rounded-full" style={{ background: off ? "#3a3f47" : t.color }} />
              {t.label}
              <span className="font-mono text-[10px] text-ink-400">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-ink-800 bg-ink-950">
        <svg viewBox={`0 0 ${W} ${H}`} className="block aspect-[10/7] w-full">
          {visibleEdges.map((e, i) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            const on = lit ? lit.has(a.id) && lit.has(b.id) && (a.id === hover || b.id === hover) : false;
            const soft = e.rel === "MENTIONS";
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={on ? "#34d399" : "#272b32"}
                strokeWidth={on ? 1.4 : soft ? 0.4 : 0.9}
                opacity={lit ? (on ? 0.9 : 0.06) : soft ? 0.35 : 0.7}
              />
            );
          })}
          {sims.map((s) => {
            const r = Math.min(4 + Math.sqrt(s.deg) * 1.9, 15);
            const showLabel = hover === s.id || (!lit && s.deg >= 11);
            return (
              <g
                key={s.id}
                role="button"
                tabIndex={0}
                aria-label={`${s.node.label}. Centre the map here.`}
                opacity={lit && !lit.has(s.id) ? 0.12 : 1}
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => goTo(s.id)}
                onKeyDown={nodeKeys(() => goTo(s.id))}
                className="cursor-pointer outline-none"
              >
                <circle cx={s.x} cy={s.y} r={r} fill={COLOR[s.node.type] ?? "#7d858f"} stroke="#0a0b0d" strokeWidth={1.5} />
                {showLabel && (
                  <text
                    x={s.x}
                    y={s.y - r - 5}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fill="#e7eaee"
                    fontSize={hover === s.id ? 14 : 10.5}
                    fontWeight={hover === s.id ? 600 : 400}
                  >
                    {s.node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-400">
        {DATA.nodes.length} nodes · {DATA.edges.length} edges. Size is link count. Hover to isolate a
        neighbourhood; click any node to centre the map on it.
      </p>
    </div>
  );
}
