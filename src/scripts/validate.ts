import { join } from "node:path";
import { loadGraph } from "../graph/load";

const CONTENT = join(process.cwd(), "content");

const { graph, issues } = loadGraph(CONTENT);

if (issues.length > 0) {
  console.error(`\n✖ ${issues.length} issue${issues.length === 1 ? "" : "s"} found:\n`);
  for (const issue of issues) {
    console.error(`  ${issue.file}\n    ${issue.message.replace(/\n/g, "\n    ")}\n`);
  }
  process.exit(1);
}

const stats = graph.stats();
console.log("\n✓ content valid\n");
for (const [key, value] of Object.entries(stats)) {
  console.log(`  ${key.padEnd(18)} ${value}`);
}

// Coverage warnings — not failures, but worth surfacing as the corpus grows.
const orphans = graph
  .heuristics()
  .filter((h) => graph.surfacesAt(h.id).length === 0)
  .map((h) => h.id);

if (orphans.length > 0) {
  console.log(
    `\n  ⚠ ${orphans.length} heuristic(s) with no SURFACES_AT edge — unreachable from any framework:`
  );
  for (const id of orphans) console.log(`      ${id}`);
}

const unteachable = graph
  .heuristics()
  .filter((h) => !h.teaching)
  .map((h) => h.id);

if (unteachable.length > 0) {
  console.log(`\n  ⚠ ${unteachable.length} heuristic(s) with no teaching block — no concept page:`);
  for (const id of unteachable) console.log(`      ${id}`);
}

const uncaveated = graph
  .heuristics()
  .filter((h) => (h.evidence_strength === "contested" || h.evidence_strength === "heuristic") && !h.caveat)
  .map((h) => h.id);

if (uncaveated.length > 0) {
  console.log(`\n  ⚠ non-replicated heuristic(s) missing a caveat:`);
  for (const id of uncaveated) console.log(`      ${id}`);
}

console.log("");
