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

  /* -------------------------------------------------------------- *
   * Situation brief. Zod guarantees the shape; these are the rules that
   * make a brief usable by someone who has not read it before.
   * -------------------------------------------------------------- */
  const b = g.brief;

  // A brief with nothing held back is a summary of the prompt. The withhold/grant
  // line is the entire product, so both sides of it have to actually exist.
  const releases = new Set(b.facts.map((f) => f.release));
  assert.ok(
    releases.has("withheld") || releases.has("on_earned_ask"),
    `${g.id}: brief holds nothing back — every fact is freely given, so there is no line to hold`
  );
  assert.ok(
    releases.has("stated") || releases.has("on_request"),
    `${g.id}: brief grants nothing — an interviewer who can only refuse is not running a case`
  );

  // Anything tightly held needs its reason on the page. "Withhold this" without a
  // why is the kind of instruction people quietly override mid-session.
  //
  // The inverse is enforced too: a fact you are handing over needs no defence, and
  // justifying all sixty of them is how a panel you glance at during a live session
  // turns back into an essay. Rationale belongs on running-a-session, once.
  for (const f of b.facts) {
    const held = f.release === "withheld" || f.release === "on_earned_ask";
    if (held) {
      assert.ok(
        f.why && f.why.length > 20,
        `${g.id}: "${f.fact.slice(0, 48)}…" is held back but does not say why`
      );
    } else {
      assert.ok(
        !f.why,
        `${g.id}: "${f.fact.slice(0, 48)}…" is freely given and does not need a justification`
      );
    }
  }

  // The pivots are what distinguish a brief from a fact sheet.
  assert.ok(b.keys.length >= 2, `${g.id}: needs at least 2 keys, has ${b.keys.length}`);
  for (const k of b.keys) {
    assert.ok(
      k.if_missed.length > 30,
      `${g.id}: key "${k.insight.slice(0, 48)}…" needs a real fallback, not a stub`
    );
  }

  // Bounded at both ends. The upper bound is the one that matters: a premise is
  // orientation, not the argument for why briefs exist, and the first draft of every
  // one of these drifted into the latter.
  assert.ok(b.premise.length > 120, `${g.id}: premise too thin to orient an interviewer`);
  assert.ok(
    b.premise.length < 420,
    `${g.id}: premise is ${b.premise.length} chars — trim to orientation, the rationale lives on running-a-session`
  );
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
