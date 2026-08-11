import { z } from "zod";

/**
 * Shared vocabulary for the pm-os knowledge graph.
 *
 * Design note: the situational dimensions here are deliberately LEAN (6).
 * Heuristics bind to predicates over these dimensions — not to archetypes —
 * so every dimension added is a field a human must author for every situation.
 * Extend this list only when a heuristic we actually want cannot be expressed.
 */

export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/, "must be kebab-case, dots allowed for composite ids");

/** Ordinal scale used by cognitive_load, motivation, and ability. */
export const Level = z.enum(["low", "medium", "high"]);
export type Level = z.infer<typeof Level>;

export const Device = z.enum(["mobile", "desktop", "tablet", "voice", "wearable"]);

/**
 * The situational dimensions. Ordinal ones are ranked in ORDINAL_SCALES.
 *
 * `stakes` was added after `motivation`/`ability` because loss aversion could not
 * be expressed without it — it fires on what the user stands to lose, which none
 * of the original six dimensions captured. That is the extension rule working as
 * intended: a dimension earns its place by unblocking a heuristic, not by seeming
 * useful in the abstract.
 */
export const SituationDimension = z.enum([
  "device",
  "hands_free",
  "time_budget_sec",
  "cognitive_load",
  "motivation",
  "ability",
  "stakes",
]);
export type SituationDimension = z.infer<typeof SituationDimension>;

/** Ranked scales so `gte`/`lt` work on ordinal values, not just numbers. */
export const ORDINAL_SCALES: Partial<Record<SituationDimension, readonly string[]>> = {
  cognitive_load: ["low", "medium", "high"],
  motivation: ["low", "medium", "high"],
  ability: ["low", "medium", "high"],
  stakes: ["low", "medium", "high"],
};

export const ComparisonOp = z.enum(["eq", "neq", "lt", "lte", "gt", "gte", "in"]);

export const Comparison = z.object({
  dim: SituationDimension,
  op: ComparisonOp,
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
});
export type Comparison = z.infer<typeof Comparison>;

/**
 * A serializable boolean expression over situational dimensions.
 * This is what makes "Hick's Law applies here" a computation rather than a tag.
 */
export type Predicate =
  | Comparison
  | { all: Predicate[] }
  | { any: Predicate[] }
  | { not: Predicate };

export const Predicate: z.ZodType<Predicate> = z.lazy(() =>
  z.union([
    Comparison,
    z.object({ all: z.array(Predicate) }),
    z.object({ any: z.array(Predicate) }),
    z.object({ not: Predicate }),
  ])
);

export const EvidenceStrength = z.enum([
  "replicated", // multiple independent studies
  "supported", // one solid study or strong practitioner consensus
  "heuristic", // widely used craft knowledge, thin empirical base
  "contested", // known replication problems or active disagreement
]);

export const Citation = z.object({
  label: z.string(),
  url: z.string().url().optional(),
  year: z.number().int().optional(),
});

/** Every node type in the graph. Edges reference nodes as {type, id}. */
export const NodeType = z.enum([
  "framework",
  "framework_part", // a stage / beat / dimension / factor within a framework
  "heuristic",
  "archetype",
  "situation",
  "company_lens",
  "question_type",
  "concept",
]);
export type NodeType = z.infer<typeof NodeType>;

export const NodeRef = z.object({
  type: NodeType,
  id: Slug,
});
export type NodeRef = z.infer<typeof NodeRef>;

export const refKey = (ref: NodeRef): string => `${ref.type}:${ref.id}`;
