import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import {
  Archetype,
  CompanyLens,
  Concept,
  Framework,
  Heuristic,
  QuestionType,
  Situation,
} from "../schema/nodes";
import { Edge, RELATION_DOMAINS, SYMMETRIC_RELATIONS } from "../schema/edges";
import { NodeRef, NodeType, refKey } from "../schema/primitives";
import { GraphIndex, type FrameworkPart } from "./index";

export interface LoadIssue {
  file: string;
  message: string;
}

/** Directory name -> schema. Directory placement determines the node type. */
const COLLECTIONS = {
  frameworks: Framework,
  heuristics: Heuristic,
  situations: Situation,
  archetypes: Archetype,
  lenses: CompanyLens,
  questions: QuestionType,
  concepts: Concept,
} as const;

function yamlFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return yamlFiles(full);
    return /\.ya?ml$/.test(entry) ? [full] : [];
  });
}

/** Content files may hold a single document or a list of them. */
function documents(raw: unknown): unknown[] {
  return Array.isArray(raw) ? raw : [raw];
}

function formatZodError(err: z.ZodError): string {
  return err.issues
    .map((i) => `  ${i.path.length ? i.path.join(".") : "<root>"}: ${i.message}`)
    .join("\n");
}

/** Explode a framework into its addressable parts so edges can target them. */
function partsOf(framework: Framework): FrameworkPart[] {
  const common = { framework_id: framework.id, framework_kind: framework.kind } as const;
  switch (framework.kind) {
    case "procedural":
      return framework.stages.map((s) => ({ ...common, ...s, part_kind: "stage" as const }));
    case "narrative":
      return framework.beats.map((b) => ({ ...common, ...b, part_kind: "beat" as const }));
    case "taxonomic":
      return framework.dimensions.map((d) => ({ ...common, ...d, part_kind: "dimension" as const }));
    case "calculative":
      return framework.factors.map((f) => ({ ...common, ...f, part_kind: "factor" as const }));
  }
}

/**
 * Read /content, validate every document, and compile a queryable graph.
 *
 * This is the seam that keeps the "files now, database later" bet honest:
 * everything downstream talks to GraphIndex, never to the filesystem. Swapping
 * the backing store for Postgres means reimplementing this function only.
 */
export function loadGraph(contentRoot: string): { graph: GraphIndex; issues: LoadIssue[] } {
  const issues: LoadIssue[] = [];
  const graph = new GraphIndex();

  for (const [dir, schema] of Object.entries(COLLECTIONS)) {
    for (const file of yamlFiles(join(contentRoot, dir))) {
      const rel = relative(contentRoot, file);
      let raw: unknown;
      try {
        raw = parse(readFileSync(file, "utf8"));
      } catch (e) {
        issues.push({ file: rel, message: `YAML parse error: ${(e as Error).message}` });
        continue;
      }
      for (const doc of documents(raw)) {
        const parsed = schema.safeParse(doc);
        if (!parsed.success) {
          issues.push({ file: rel, message: `schema error:\n${formatZodError(parsed.error)}` });
          continue;
        }
        graph.addNode(dir as keyof typeof COLLECTIONS, parsed.data, rel);
      }
    }
  }

  // Frameworks contribute their parts as addressable nodes.
  for (const framework of graph.frameworks()) {
    for (const part of partsOf(framework)) graph.addPart(part);
  }

  for (const file of yamlFiles(join(contentRoot, "edges"))) {
    const rel = relative(contentRoot, file);
    let raw: unknown;
    try {
      raw = parse(readFileSync(file, "utf8"));
    } catch (e) {
      issues.push({ file: rel, message: `YAML parse error: ${(e as Error).message}` });
      continue;
    }
    for (const doc of documents(raw)) {
      const parsed = Edge.safeParse(doc);
      if (!parsed.success) {
        issues.push({ file: rel, message: `edge error:\n${formatZodError(parsed.error)}` });
        continue;
      }
      graph.addEdge(parsed.data, rel);
    }
  }

  issues.push(...validateIntegrity(graph));
  return { graph, issues };
}

/** Checks that Zod cannot express because they span documents. Called by loadGraph. */
function validateIntegrity(graph: GraphIndex): LoadIssue[] {
  const issues: LoadIssue[] = [];
  const at = (ref: NodeRef) => refKey(ref);

  for (const { edge, file } of graph.edgeEntries()) {
    const domain = RELATION_DOMAINS[edge.relation];
    if (!domain.from.includes(edge.from.type)) {
      issues.push({
        file,
        message: `${edge.relation} cannot originate at a "${edge.from.type}" (expected ${domain.from.join(" | ")})`,
      });
    }
    if (!domain.to.includes(edge.to.type)) {
      issues.push({
        file,
        message: `${edge.relation} cannot point at a "${edge.to.type}" (expected ${domain.to.join(" | ")})`,
      });
    }
    for (const ref of [edge.from, edge.to]) {
      if (!graph.has(ref)) {
        issues.push({ file, message: `dangling reference: ${at(ref)} does not exist` });
      }
    }
    if (SYMMETRIC_RELATIONS.has(edge.relation) && at(edge.from) === at(edge.to)) {
      issues.push({ file, message: `${edge.relation} cannot connect ${at(edge.from)} to itself` });
    }
  }

  // Archetypes must point at situations that exist.
  for (const archetype of graph.archetypes()) {
    for (const id of archetype.typical_situations) {
      const ref = NodeRef.parse({ type: "situation" as NodeType, id });
      if (!graph.has(ref)) {
        issues.push({
          file: graph.fileOf({ type: "archetype", id: archetype.id }) ?? archetype.id,
          message: `archetype "${archetype.id}" references missing situation "${id}"`,
        });
      }
    }
  }

  // Weighted collections must actually sum to 100 or the scoring maths lies.
  for (const framework of graph.frameworks()) {
    if (framework.kind !== "procedural") continue;
    const total = framework.stages.reduce((s, stage) => s + stage.expected_duration_pct, 0);
    if (Math.abs(total - 100) > 0.51) {
      issues.push({
        file: graph.fileOf({ type: "framework", id: framework.id }) ?? framework.id,
        message: `stage durations sum to ${total}%, expected 100%`,
      });
    }
  }

  for (const lens of graph.lenses()) {
    const total = lens.rubric.reduce((s, d) => s + d.weight, 0);
    if (Math.abs(total - 100) > 0.51) {
      issues.push({
        file: graph.fileOf({ type: "company_lens", id: lens.id }) ?? lens.id,
        message: `rubric weights sum to ${total}, expected 100`,
      });
    }
  }

  return issues;
}
