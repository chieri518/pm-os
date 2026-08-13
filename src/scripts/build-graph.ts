import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadGraph } from "../graph/load";
import { buildLinkIndex } from "../graph/linker";

/**
 * Compile /content into the artefacts the app needs.
 *
 * This is the "files now, database later" seam made concrete: today it reads YAML,
 * tomorrow it reads Postgres, and nothing downstream knows the difference.
 *
 * Three derived indexes are emitted alongside the graph, all computed here rather
 * than at request time because they are pure functions of the content:
 *   search.json    — a compact index for the command palette
 *   mentions.json  — who mentions whom in prose, for backlinks
 *   graphview.json — nodes and edges for the visual map
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

/* ---------------------------------------------------------------- search */
const index = buildLinkIndex(graph);
const search = index.targets.map((t) => ({
  id: t.id,
  type: t.type,
  href: t.href,
  label: t.label,
  summary: t.summary.length > 140 ? `${t.summary.slice(0, 140).trim()}…` : t.summary,
}));
writeFileSync(join(outDir, "search.json"), JSON.stringify(search));

/* -------------------------------------------------------------- mentions
 * Which nodes mention which other nodes anywhere in their prose. This is what
 * lets a backlinks panel show "mentioned in" alongside the typed edges — the
 * edges are authored, these are discovered. */
const mentions: Record<string, string[]> = {};
for (const t of index.targets) {
  const node = graph.get(t.type, t.id);
  if (!node) continue;
  const text = JSON.stringify(node).toLowerCase();
  const found = new Set<string>();
  for (const [phrase, target] of index.byPhrase) {
    if (target.key === t.key) continue;
    if (text.includes(phrase)) found.add(target.key);
  }
  if (found.size) mentions[t.key] = [...found];
}
// Invert: target -> who mentions it.
const inbound: Record<string, string[]> = {};
for (const [from, tos] of Object.entries(mentions)) {
  for (const to of tos) (inbound[to] ??= []).push(from);
}
writeFileSync(join(outDir, "mentions.json"), JSON.stringify(inbound));

/* ------------------------------------------------------------- graph view */
const viewNodes = index.targets.map((t) => ({ id: t.key, type: t.type, label: t.label, href: t.href }));
const known = new Set(viewNodes.map((n) => n.id));
// `rel` is widened past RelationType because MENTIONS is derived here rather than
// authored — it is a rendering concern for the map, not a relation in the schema.
const viewEdges: { from: string; to: string; rel: string }[] = bundle.edges
  .map((e) => ({
    from: `${e.from.type}:${e.from.id}`,
    to: `${e.to.type}:${e.to.id}`,
    rel: e.relation,
  }))
  .filter((e) => known.has(e.from) && known.has(e.to));
// Prose mentions become soft edges so the map reflects how the corpus actually reads.
for (const [to, froms] of Object.entries(inbound)) {
  for (const from of froms) {
    if (known.has(from) && known.has(to)) viewEdges.push({ from, to, rel: "MENTIONS" });
  }
}
writeFileSync(join(outDir, "graphview.json"), JSON.stringify({ nodes: viewNodes, edges: viewEdges }));

const kb = (o: unknown) => (JSON.stringify(o).length / 1024).toFixed(1);
console.log(`✓ graph.json      ${kb(bundle)} kB`);
console.log(`✓ search.json     ${kb(search)} kB  (${search.length} entries)`);
console.log(`✓ mentions.json   ${kb(inbound)} kB  (${Object.keys(inbound).length} nodes with backlinks)`);
console.log(`✓ graphview.json  ${kb({ nodes: viewNodes, edges: viewEdges })} kB  (${viewNodes.length} nodes, ${viewEdges.length} edges)`);
console.log(`  ${Object.entries(graph.stats()).map(([k, v]) => `${k}:${v}`).join("  ")}`);
