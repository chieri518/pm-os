import { strict as assert } from "node:assert";
import { join } from "node:path";
import { loadGraph } from "../graph/load";
import { GraphIndex } from "../graph/index";
import type { Situation } from "../schema/nodes";
import { buildPracticeData, buildScenario } from "../practice/model";

/**
 * Smoke test for the path the practice builder exercises: heuristics evaluated
 * against situation vectors through a bundle round-trip, plus the scenario
 * assembly the client depends on.
 *
 * The CLI demo only ever queries STORED situations, so it would not catch a
 * regression in `applicableFor`, in serialization, or in scenario construction.
 */

const { graph: source, issues } = loadGraph(join(process.cwd(), "content"));
assert.equal(issues.length, 0, "content must be valid before checking the practice path");

// Round-trip through the bundle exactly as the browser does.
const graph = GraphIndex.fromBundle(JSON.parse(JSON.stringify(source.toBundle())));

const base: Situation = {
  id: "__live",
  label: "",
  narrative: "",
  device: "mobile",
  hands_free: 1,
  time_budget_sec: 90,
  cognitive_load: "high",
  motivation: "high",
  ability: "medium",
  stakes: "medium",
};

const fired = (s: Situation) =>
  graph
    .applicableFor(s)
    .filter((h) => h.fires)
    .map((h) => h.heuristic.id)
    .sort();

const baseline = fired(base);
const lowLoadOnly = fired({ ...base, cognitive_load: "low" });
const unhurried = fired({ ...base, cognitive_load: "low", time_budget_sec: 900 });
const lowStakes = fired({ ...base, stakes: "low" });

const lost = (before: string[], after: string[]) => before.filter((x) => !after.includes(x));

console.log("baseline                ", baseline.join(", "));
console.log("load→low only           ", `-${lost(baseline, lowLoadOnly).join(", ") || "none"}`);
console.log("load→low + 15min budget ", `-${lost(baseline, unhurried).join(", ") || "none"}`);
console.log("stakes→low              ", `-${lost(baseline, lowStakes).join(", ") || "none"}`);
console.log(
  "tensions                ",
  `${graph.tensionsAmong(baseline).length} at baseline → ${graph.tensionsAmong(unhurried).length} unhurried`
);

assert.ok(baseline.length > 0, "baseline situation should fire at least one heuristic");

// Hick's Law is an `any` predicate over {high load, sub-120s budget}. Relaxing ONE
// clause must not switch it off — the remaining clause still carries it. This is the
// behaviour that makes the dormant panel's "needs any of" wording correct.
assert.ok(
  lowLoadOnly.includes("hicks-law"),
  "an `any` predicate must survive one clause going false"
);
assert.ok(
  lost(baseline, unhurried).includes("hicks-law"),
  "Hick's Law must switch off once BOTH of its clauses go false"
);
assert.ok(
  lost(baseline, lowStakes).includes("loss-aversion"),
  "dropping stakes must switch Loss Aversion off — the 7th dimension earning its place"
);
assert.ok(
  graph.tensionsAmong(unhurried).length < graph.tensionsAmong(baseline).length,
  "fewer firing heuristics should mean fewer live tensions"
);

// Decision-scope heuristics must never appear in situational results.

assert.ok(
  !baseline.includes("type-1-type-2-doors"),
  "decision-scope heuristics must not fire situationally"
);


/* ---------------------------------------------------------------- scenario */

const data = buildPracticeData(source);
const productType = data.questionTypes.find((q) => q.family === "product")!;
const withContext = buildScenario(data, {
  questionTypeId: productType.id,
  lensId: "meta",
  archetypeId: "time-poor-new-parent",
  situationId: "night-feed-checkout",
  promptIndex: 0,
  sessionMinutes: 25,
})!;

assert.ok(withContext.stages.length > 0, "a product scenario should produce a scaffold");
assert.ok(
  Math.abs(withContext.stages.reduce((s, x) => s + x.targetSec, 0) - 25 * 60) < 10,
  "stage targets should sum to the session length"
);
// The whole point of the builder: Meta's weighting must move Identify above the
// framework's own default share, not merely reproduce it.
const identify = withContext.stages.find((s) => s.id === "circles.identify")!;
assert.ok(identify.divergence > 0, "Meta should weight Identify above the CIRCLES default");
assert.ok(withContext.checks.length > 0, "a scenario should produce self-check items");
assert.ok(
  !/for a .*—.*for a /.test(withContext.prompt),
  "a bound prompt should not stack two user contexts"
);

const noContext = buildScenario(data, {
  questionTypeId: "behavioral",
  lensId: "amazon",
  archetypeId: "time-poor-new-parent",
  situationId: "night-feed-checkout",
  promptIndex: 0,
  sessionMinutes: 15,
})!;
assert.equal(noContext.contextLine, null, "non-product questions should carry no user context");

console.log(
  `scenario                 ${withContext.stages.length} stages, ${withContext.checks.length} checks, Identify ${identify.pct}% (${identify.divergence > 0 ? "+" : ""}${identify.divergence} vs default)`
);
console.log("\n✓ practice query path OK");
