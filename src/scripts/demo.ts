import { join } from "node:path";
import { loadGraph } from "../graph/load";
import { describe } from "../graph/predicate";
import type { GraphIndex } from "../graph/index";
import type { Archetype, Situation } from "../schema/nodes";

/**
 * The milestone-1 forcing function.
 *
 * "For a Meta Product Design round, for a time-poor new parent at 2am — which
 *  CIRCLES stage matters most, which heuristics apply, which conflict, and why?"
 *
 * If the schema cannot answer this without hand-waving, it is the wrong schema.
 */

const { graph, issues } = loadGraph(join(process.cwd(), "content"));
if (issues.length) {
  console.error("content is invalid — run `npm run validate`");
  process.exit(1);
}

const rule = (label = "") =>
  console.log(`\n\x1b[2m${"─".repeat(78)}\x1b[0m${label ? ` \x1b[1m${label}\x1b[0m` : ""}`);
const h1 = (s: string) => console.log(`\n\x1b[1m\x1b[36m${s}\x1b[0m`);
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function situationVector(s: Situation): string {
  return [
    `${s.device}`,
    `${s.hands_free} hand(s)`,
    `${s.time_budget_sec}s`,
    `load:${s.cognitive_load}`,
    `mot:${s.motivation}`,
    `abl:${s.ability}`,
    `stakes:${s.stakes}`,
  ].join(dim(" · "));
}

/** Which heuristics fire here, and the leaf comparisons that made them fire. */
function reportHeuristics(graph: GraphIndex, situationId: string): string[] {
  const hits = graph.applicableHeuristics(situationId);
  for (const { heuristic, trace } of hits) {
    const fired = trace.filter((t) => t.result);
    const why = fired.map((t) => `${t.expr} (actual: ${t.actual})`).join("; ");
    const flag =
      heuristic.evidence_strength === "contested"
        ? " \x1b[33m[contested]\x1b[0m"
        : heuristic.evidence_strength === "heuristic"
          ? dim(" [craft heuristic]")
          : "";
    console.log(`  • \x1b[1m${heuristic.name}\x1b[0m${flag}`);
    console.log(`      ${dim("fires because")} ${why || dim("(no leaf fired)")}`);
    console.log(`      ${heuristic.implication.replace(/\s+/g, " ").trim().slice(0, 150)}`);
  }
  return hits.map((h) => h.heuristic.id);
}

/* ------------------------------------------------------------------ *
 * MAIN QUERY
 * ------------------------------------------------------------------ */

const archetype = graph.expect<Archetype>("archetype", "time-poor-new-parent");
const night = graph.expect<Situation>("situation", "night-feed-checkout");
const weekend = graph.expect<Situation>("situation", "weekend-meal-planning");

h1("QUERY  Meta · Product Design · CIRCLES");
console.log(`  archetype  ${archetype.name} ${dim(`(${archetype.age_band}, ${archetype.life_stage})`)}`);
console.log(`  situation  ${night.label}`);
console.log(`             ${situationVector(night)}`);

rule("1 · APPLICABLE HEURISTICS");
const nightIds = reportHeuristics(graph, night.id);

rule("2 · TENSIONS TO RESOLVE OUT LOUD");
const tensions = graph.tensionsAmong(nightIds);
if (!tensions.length) console.log(dim("  none among the applicable set"));
for (const { a, b, edge } of tensions) {
  console.log(`  ⚡ \x1b[1m${a.name}\x1b[0m ↔ \x1b[1m${b.name}\x1b[0m ${dim(`(strength ${edge.strength})`)}`);
  console.log(`      ${edge.rationale.replace(/\s+/g, " ").trim()}\n`);
}

rule("3 · WHERE META SPENDS ITS POINTS");
const metaStages = graph.weightedParts("meta", "circles");
for (const { part, weight, edge } of metaStages.slice(0, 3)) {
  const bar = "█".repeat(Math.round(weight / 2));
  console.log(`  ${String(weight).padStart(3)}%  ${bar} \x1b[1m${part.name}\x1b[0m`);
  console.log(`        ${dim(edge.rationale.replace(/\s+/g, " ").trim())}`);
}
const budget = metaStages[0]?.part.expected_duration_pct;
console.log(
  `\n  ${dim(`CIRCLES allots ${budget}% of answer time to ${metaStages[0]?.part.name}; Meta weights it ${metaStages[0]?.weight}%.`)}`
);
console.log(`  ${dim("Under-spending here is the single most expensive mistake in this lens.")}`);

rule("4 · HEURISTICS BY STAGE");
for (const { part } of metaStages.slice(0, 5)) {
  const attached = graph
    .heuristics()
    .flatMap((h) => graph.surfacesAt(h.id).filter((s) => s.part.id === part.id).map((s) => ({ h, s })));
  if (!attached.length) continue;
  const applicable = new Set(nightIds);
  console.log(`  ${part.name}`);
  for (const { h } of attached) {
    const live = applicable.has(h.id) || h.scope === "decision";
    console.log(`      ${live ? "\x1b[32m●\x1b[0m" : dim("○")} ${h.name}${h.scope === "decision" ? dim(" (decision-scope)") : ""}`);
  }
}
console.log(`\n  ${dim("● fires in this situation   ○ exists but does not fire here")}`);

/* ------------------------------------------------------------------ *
 * THE TWO CONTRASTS THAT JUSTIFY THE ARCHITECTURE
 * ------------------------------------------------------------------ */

h1("CONTROL A  same person, different situation");
console.log(`  ${weekend.label}`);
console.log(`  ${situationVector(weekend)}\n`);
const weekendIds = reportHeuristics(graph, weekend.id);

const gained = weekendIds.filter((id) => !nightIds.includes(id));
const lost = nightIds.filter((id) => !weekendIds.includes(id));
console.log(
  `\n  ${dim("delta:")} ${lost.length ? `\x1b[31m−${lost.join(", ")}\x1b[0m` : ""}  ${gained.length ? `\x1b[32m+${gained.join(", ")}\x1b[0m` : ""}`
);
console.log(dim("  Identical archetype. Different advice. This is why heuristics bind to"));
console.log(dim("  situations rather than to people."));

h1("CONTROL B  same situation, different company");
const amazonStages = graph.weightedParts("amazon", "circles");
console.log(`  ${"stage".padEnd(28)} ${"Meta".padStart(6)}  ${"Amazon".padStart(7)}   swing`);
for (const { part, weight } of metaStages) {
  const amz = amazonStages.find((s) => s.part.id === part.id)?.weight ?? 0;
  const delta = amz - weight;
  const arrow = delta > 0 ? `\x1b[32m▲ +${delta}\x1b[0m` : delta < 0 ? `\x1b[31m▼ ${delta}\x1b[0m` : dim("—");
  console.log(`  ${part.name.padEnd(28)} ${String(weight).padStart(5)}%  ${String(amz).padStart(6)}%   ${arrow}`);
}
console.log(dim("\n  The same answer, delivered identically, scores differently. Meta pays for"));
console.log(dim("  segmentation; Amazon pays for the decision at the end.\n"));
