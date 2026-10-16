import { join } from "node:path";
import { loadGraph } from "../graph/load";
import { describe } from "../graph/predicate";
import { isExperienceHeuristic } from "../schema/nodes";

/**
 * The semantic check that `validate` cannot do: where does this heuristic
 * actually land in the graph? Schema validity says the file is well-formed;
 * this says whether it fires in the situations a reader would expect.
 *
 *   npm run inspect -- zeigarnik-effect
 */

const id = process.argv[2];
if (!id) {
  console.error("usage: npm run inspect -- <heuristic-id>");
  process.exit(1);
}

const { graph, issues } = loadGraph(join(process.cwd(), "content"));
if (issues.length > 0) {
  console.error(`✖ content has ${issues.length} validation issue(s) — run \`npm run validate\` first`);
  process.exit(1);
}

const heuristic = graph.heuristics().find((h) => h.id === id);
if (!heuristic) {
  console.error(`✖ no heuristic with id "${id}"`);
  process.exit(1);
}

const ref = { type: "heuristic" as const, id };
console.log(`\n${heuristic.name}  [${heuristic.scope}, ${heuristic.evidence_strength}]\n`);

if (isExperienceHeuristic(heuristic)) {
  console.log(`  applies when: ${describe(heuristic.applies_when)}\n`);
  const hits = graph.situations().map((s) => ({
    situation: s,
    fires: graph.applicableFor(s).find((h) => h.heuristic.id === id)?.fires ?? false,
  }));
  const on = hits.filter((h) => h.fires);
  console.log(`  fires in ${on.length} of ${hits.length} situations:`);
  for (const { situation, fires } of hits) {
    console.log(`    ${fires ? "●" : "○"} ${situation.id.padEnd(24)} ${situation.label}`);
  }
  if (on.length === 0) console.log(`\n  ⚠ fires nowhere — predicate is probably too narrow`);
  if (on.length === hits.length) console.log(`\n  ⚠ fires everywhere — predicate is probably too broad`);
} else {
  console.log(`  decision-scope: no predicate; reaches the graph only via SURFACES_AT`);
}

const surfaces = graph.surfacesAt(id);
console.log(`\n  surfaces at (${surfaces.length}):`);
for (const { part, edge } of surfaces) console.log(`    ${part.id.padEnd(24)} strength ${edge.strength}`);

const linked = (relation: "TENSIONS_WITH" | "SPECIALIZES") =>
  graph.edgesFrom(ref, relation).map((e) => graph.otherEnd(e, ref).id);
console.log(`\n  tensions with: ${linked("TENSIONS_WITH").join(", ") || "—"}`);
console.log(`  specializes:   ${linked("SPECIALIZES").join(", ") || "—"}`);
console.log(`  teaching block: ${heuristic.teaching ? "yes" : "MISSING"}\n`);
