"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import raw from "@/src/generated/graphview.json";

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
}
const DATA = raw as { nodes: RawNode[]; edges: RawEdge[] };

const TYPES = [
  { id: "question_type", label: "Questions", color: "#f0abfc" },
  { id: "concept", label: "Concepts", color: "#34d399" },
  { id: "term", label: "Terms", color: "#60a5fa" },
  { id: "framework", label: "Frameworks", color: "#fbbf24" },
  { id: "heuristic", label: "Heuristics", color: "#a78bfa" },
  { id: "company_lens", label: "Companies", color: "#fb7185" },
] as const;

const COLOR = Object.fromEntries(TYPES.map((t) => [t.id, t.color])) as Record<string, string>;

interface Sim {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  deg: number;
  node: RawNode;
}

const W = 1000;
const H = 700;

/**
 * A small force-directed layout, written out rather than pulled in.
 *
 * ~90 nodes and ~350 edges is far too small to justify a graph library, and a
 * dependency here would also have to survive the CSP on a static export. Three
 * forces, 320 iterations, deterministic seeding — so the same corpus always draws
 * the same map, which matters when a screenshot goes in a case study.
 */
function layout(nodes: RawNode[], edges: RawEdge[]): Sim[] {
  const deg = new Map<string, number>();
  for (const e of edges) {
    deg.set(e.from, (deg.get(e.from) ?? 0) + 1);
    deg.set(e.to, (deg.get(e.to) ?? 0) + 1);
  }

  // Deterministic seed: place by type on a ring, so clusters start apart.
  const sims: Sim[] = nodes.map((n, i) => {
    const t = Math.max(0, TYPES.findIndex((x) => x.id === n.type));
    const a = (t / TYPES.length) * Math.PI * 2;
    const r = 150 + ((i * 37) % 120);
    return {
      id: n.id,
      x: W / 2 + Math.cos(a) * r + ((i * 53) % 40) - 20,
      y: H / 2 + Math.sin(a) * r + ((i * 31) % 40) - 20,
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

    // Repulsion — every pair, which is fine at this size.
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

    // Attraction along edges.
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

    // Gravity toward centre, then integrate with damping.
    for (const s of sims) {
      s.vx += (W / 2 - s.x) * 0.004;
      s.vy += (H / 2 - s.y) * 0.004;
      s.x += Math.max(-18, Math.min(18, s.vx)) * cool;
      s.y += Math.max(-18, Math.min(18, s.vy)) * cool;
      s.vx *= 0.82;
      s.vy *= 0.82;
    }
  }
  return sims;
}

export default function GraphClient() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const visibleNodes = useMemo(
    () => DATA.nodes.filter((n) => !hidden.has(n.type)),
    [hidden]
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => DATA.edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to)),
    [visibleIds]
  );

  const sims = useMemo(() => layout(visibleNodes, visibleEdges), [visibleNodes, visibleEdges]);
  const byId = useMemo(() => new Map(sims.map((s) => [s.id, s])), [sims]);

  // Layout runs synchronously and briefly blocks; render after first paint so the
  // page does not appear frozen on load.
  useEffect(() => setReady(true), []);

  const neighbours = useMemo(() => {
    if (!focus) return null;
    const set = new Set<string>([focus]);
    for (const e of visibleEdges) {
      if (e.from === focus) set.add(e.to);
      if (e.to === focus) set.add(e.from);
    }
    return set;
  }, [focus, visibleEdges]);

  const dim = (id: string) => (neighbours && !neighbours.has(id) ? 0.12 : 1);
  const focused = focus ? byId.get(focus) : null;

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
              onClick={() =>
                setHidden((h) => {
                  const next = new Set(h);
                  if (next.has(t.id)) next.delete(t.id);
                  else next.add(t.id);
                  return next;
                })
              }
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                off
                  ? "border-ink-800 bg-ink-900 text-ink-600"
                  : "border-ink-700 bg-ink-850 text-ink-200"
              }`}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: off ? "#3a3f47" : t.color }}
              />
              {t.label}
              <span className="font-mono text-[10px] text-ink-400">{count}</span>
            </button>
          );
        })}
        {focus && (
          <button
            type="button"
            onClick={() => setFocus(null)}
            className="ml-auto rounded-full border border-ink-700 bg-ink-850 px-2.5 py-1 text-xs text-ink-300"
          >
            clear focus ✕
          </button>
        )}
      </div>

      <div
        ref={wrap}
        className="relative overflow-hidden rounded-xl border border-ink-800 bg-ink-950"
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-[68vh] w-full touch-none">
          {ready &&
            visibleEdges.map((e, i) => {
              const a = byId.get(e.from);
              const b = byId.get(e.to);
              if (!a || !b) return null;
              const lit = neighbours ? neighbours.has(a.id) && neighbours.has(b.id) : false;
              const soft = e.rel === "MENTIONS";
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={lit ? "#34d399" : "#272b32"}
                  strokeWidth={lit ? 1.4 : soft ? 0.4 : 0.9}
                  opacity={neighbours ? (lit ? 0.9 : 0.06) : soft ? 0.35 : 0.7}
                />
              );
            })}
          {ready &&
            sims.map((s) => {
              const r = Math.min(4 + Math.sqrt(s.deg) * 1.9, 15);
              return (
                <g
                  key={s.id}
                  opacity={dim(s.id)}
                  onMouseEnter={() => setFocus(s.id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={r}
                    fill={COLOR[s.node.type] ?? "#7d858f"}
                    stroke="#0a0b0d"
                    strokeWidth={1.5}
                  />
                  {(s.deg > 9 || focus === s.id) && (
                    <text
                      x={s.x}
                      y={s.y - r - 5}
                      textAnchor="middle"
                      className="pointer-events-none select-none"
                      fill="#e7eaee"
                      fontSize={focus === s.id ? 13 : 10}
                      fontWeight={focus === s.id ? 600 : 400}
                    >
                      {s.node.label}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>

        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-sm text-ink-400">
            laying out {DATA.nodes.length} nodes…
          </div>
        )}

        {focused && (
          <div className="absolute bottom-3 left-3 max-w-xs rounded-lg border border-ink-700 bg-ink-900/95 p-3 backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              {focused.node.type.replace("_", " ")} · {focused.deg} links
            </div>
            <div className="mt-0.5 text-[15px] font-medium text-ink-100">{focused.node.label}</div>
            <Link
              href={focused.node.href as Route}
              className="mt-1.5 inline-block text-[13px] text-live-400 underline-offset-2 hover:underline"
            >
              Open →
            </Link>
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-400">
        {DATA.nodes.length} nodes · {DATA.edges.length} edges. Node size is link count. Faint edges
        are prose mentions discovered at build time; solid edges are authored relationships. Hover
        to isolate a neighbourhood.
      </p>
    </div>
  );
}
