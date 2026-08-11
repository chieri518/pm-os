import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadGraph } from "../graph/load";

/**
 * Compile /content into a single JSON bundle the browser can import.
 *
 * This is the "files now, database later" seam made concrete: today it reads YAML,
 * tomorrow it reads Postgres, and nothing downstream knows the difference.
 */

const { graph, issues } = loadGraph(join(process.cwd(), "content"));

if (issues.length > 0) {
  console.error(`✖ refusing to build a bundle from invalid content (${issues.length} issues).`);
  console.error("  run `npm run validate` for detail.");
  process.exit(1);
}

const outDir = join(process.cwd(), "src", "generated");
mkdirSync(outDir, { recursive: true });

const bundle = graph.toBundle();
writeFileSync(join(outDir, "graph.json"), JSON.stringify(bundle, null, 2));

// No separate client bundle any more: the practice builder receives a purpose-built
// view model (src/practice/model.ts) rather than a trimmed copy of the whole graph.
const kb = (o: unknown) => (JSON.stringify(o).length / 1024).toFixed(1);
console.log(`✓ wrote src/generated/graph.json  ${kb(bundle)} kB`);
console.log(`  ${Object.entries(graph.stats()).map(([k, v]) => `${k}:${v}`).join("  ")}`);
