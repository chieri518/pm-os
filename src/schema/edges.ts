import { z } from "zod";
import { Citation, NodeRef, Predicate } from "./primitives";

/**
 * Typed, directional edges.
 *
 * The `rationale` field is the product, not metadata. It is consumed three ways:
 *   1. explanation copy on the concept and framework pages
 *   2. feedback lines in the mock-interview scoring engine
 *   3. revision material for the candidate
 * Authored once on the edge, read everywhere. A flat tag table would force
 * all three surfaces to author that copy separately.
 */
export const RelationType = z.enum([
  /** Heuristic -> Situation. Curated override/confirmation of the predicate. */
  "APPLIES_TO",
  /** Heuristic -> framework_part. Where in an answer you deploy it. */
  "SURFACES_AT",
  /** Heuristic <-> Heuristic. Symmetric. MUST carry resolution guidance. */
  "TENSIONS_WITH",
  /** Heuristic -> Heuristic. The narrower case of a broader rule. */
  "SPECIALIZES",
  /** company_lens -> framework_part. Carries `weight`. */
  "WEIGHTS",
  /** Situation -> Archetype. Many-to-many by design. */
  "TYPICAL_FOR",
  /** QuestionType -> Framework. Which structures fit this kind of question. */
  "ANSWERED_WITH",
  /** QuestionType -> CompanyLens. Which companies lean on this question type. */
  "ASKED_BY",
  /** QuestionType -> Concept. Subject knowledge you are assumed to already have. */
  "REQUIRES",
]);
export type RelationType = z.infer<typeof RelationType>;

/** Relations where direction carries no meaning; traversal walks them both ways. */
export const SYMMETRIC_RELATIONS: ReadonlySet<RelationType> = new Set<RelationType>([
  "TENSIONS_WITH",
]);

export const Edge = z
  .object({
    from: NodeRef,
    to: NodeRef,
    relation: RelationType,
    /** Why this edge exists. Required — an edge without a reason is a tag. */
    rationale: z.string().min(20, "rationale must be a real explanation, not a label"),
    /** Optional extra gate on top of the heuristic's own predicate. */
    conditions: Predicate.optional(),
    /** 1 = weak/situational, 5 = load-bearing. */
    strength: z.number().int().min(1).max(5).default(3),
    /** Only meaningful on WEIGHTS edges. */
    weight: z.number().min(0).max(100).optional(),
    source: Citation.optional(),
  })
  .superRefine((edge, ctx) => {
    if (edge.relation === "WEIGHTS" && edge.weight === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WEIGHTS edges must carry a numeric `weight`",
      });
    }
    if (edge.relation === "TENSIONS_WITH" && !/resolve|prefer|favor|toward|when/i.test(edge.rationale)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "TENSIONS_WITH rationale must include resolution guidance (how to decide between them)",
      });
    }
  });
export type Edge = z.infer<typeof Edge>;

/** Which node types each relation is allowed to connect. Enforced at load time. */
export const RELATION_DOMAINS: Record<RelationType, { from: string[]; to: string[] }> = {
  APPLIES_TO: { from: ["heuristic"], to: ["situation"] },
  SURFACES_AT: { from: ["heuristic"], to: ["framework_part"] },
  TENSIONS_WITH: { from: ["heuristic"], to: ["heuristic"] },
  SPECIALIZES: { from: ["heuristic"], to: ["heuristic"] },
  WEIGHTS: { from: ["company_lens"], to: ["framework_part"] },
  TYPICAL_FOR: { from: ["situation"], to: ["archetype"] },
  ANSWERED_WITH: { from: ["question_type"], to: ["framework"] },
  ASKED_BY: { from: ["question_type"], to: ["company_lens"] },
  REQUIRES: { from: ["question_type"], to: ["concept"] },
};
