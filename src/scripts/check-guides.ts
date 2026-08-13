import { strict as assert } from "node:assert";
import { join } from "node:path";
import { loadGraph } from "../graph/load";
import type { InterviewGuide, QuestionType } from "../schema/nodes";

/**
 * Integrity checks for the interviewer guides that Zod cannot express because
 * they span documents, plus the content rules that make a guide usable live.
 */

const { graph, issues } = loadGraph(join(process.cwd(), "content"));
assert.equal(issues.length, 0, "content must be valid before checking guides");

const guides = graph.guides();
const types = new Set(graph.questionTypes().map((q: QuestionType) => q.id));
const covered = new Set<string>();

for (const g of guides as InterviewGuide[]) {
  assert.ok(types.has(g.question_type), `${g.id}: unknown question_type "${g.question_type}"`);
  covered.add(g.question_type);

  // A guide with no probes is a question, not a guide — the probe ladder is the point.
  assert.ok(g.probes.length >= 3, `${g.id}: needs at least 3 probes, has ${g.probes.length}`);

  // Checkpoints must fit inside the stated duration, or the pacing advice is wrong.
  for (const c of g.checkpoints) {
    assert.ok(
      c.at_min <= g.duration_min,
      `${g.id}: checkpoint at ${c.at_min}m exceeds duration ${g.duration_min}m`
    );
  }
  const mins = g.checkpoints.map((c) => c.at_min);
  assert.deepEqual([...mins].sort((a, b) => a - b), mins, `${g.id}: checkpoints out of order`);

  const signals = g.signal_groups.flatMap((s) => s.signals);
  assert.ok(signals.length >= 6, `${g.id}: only ${signals.length} signals; needs 6+ to be usable`);
  assert.ok(g.bias_guards.length >= 2, `${g.id}: needs at least 2 bias guards`);

  // Provenance is not optional here. These are constructed, not leaked.
  assert.ok(g.basis.length > 40, `${g.id}: basis must explain how the guide was constructed`);
}

const missing = [...types].filter((t) => !covered.has(t));
console.log(`guides            ${guides.length}`);
console.log(`question types    ${types.size} (${covered.size} with a guide)`);
console.log(
  `probes            ${guides.reduce((n, g) => n + g.probes.length, 0)} across all guides`
);
console.log(
  `signals           ${guides.reduce((n, g) => n + g.signal_groups.flatMap((s) => s.signals).length, 0)}`
);
if (missing.length) console.log(`\n  ⚠ no guide yet for: ${missing.join(", ")}`);

console.log("\n✓ interviewer guides OK");
