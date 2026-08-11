import {
  Comparison,
  ORDINAL_SCALES,
  Predicate,
  SituationDimension,
} from "../schema/primitives";
import type { Situation } from "../schema/nodes";

/** A single leaf evaluation, kept for explainability. */
export interface Trace {
  expr: string;
  actual: string | number;
  result: boolean;
}

export interface EvalResult {
  result: boolean;
  trace: Trace[];
}

const isComparison = (p: Predicate): p is Comparison => "dim" in p;

/**
 * Map an ordinal value ("high") to its rank so `gte`/`lt` are meaningful.
 * Numeric dimensions pass through untouched.
 */
function rank(dim: SituationDimension, value: string | number): number | string {
  const scale = ORDINAL_SCALES[dim];
  if (!scale) return value;
  const idx = scale.indexOf(String(value));
  if (idx === -1) {
    throw new Error(`"${value}" is not a valid value for ordinal dimension "${dim}"`);
  }
  return idx;
}

function compare(cmp: Comparison, situation: Situation): Trace {
  const actual = situation[cmp.dim] as string | number;

  if (cmp.op === "in") {
    const list = Array.isArray(cmp.value) ? cmp.value : [cmp.value];
    return {
      expr: `${cmp.dim} in [${list.join(", ")}]`,
      actual,
      result: list.some((v) => String(v) === String(actual)),
    };
  }

  if (Array.isArray(cmp.value)) {
    throw new Error(`operator "${cmp.op}" on "${cmp.dim}" cannot take an array value`);
  }

  const a = rank(cmp.dim, actual);
  const b = rank(cmp.dim, cmp.value);
  const expr = `${cmp.dim} ${cmp.op} ${cmp.value}`;

  // Ordering operators require both sides to be comparable numbers.
  if (cmp.op !== "eq" && cmp.op !== "neq") {
    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error(
        `operator "${cmp.op}" needs a numeric or ordinal dimension; "${cmp.dim}" is categorical`
      );
    }
    const result =
      cmp.op === "lt" ? a < b : cmp.op === "lte" ? a <= b : cmp.op === "gt" ? a > b : a >= b;
    return { expr, actual, result };
  }

  const equal = String(a) === String(b);
  return { expr, actual, result: cmp.op === "eq" ? equal : !equal };
}

/**
 * Evaluate a predicate against a situation, collecting a trace of every leaf
 * comparison so the UI can explain *why* a heuristic fired — not just that it did.
 */
export function evaluate(predicate: Predicate, situation: Situation): EvalResult {
  const trace: Trace[] = [];

  const walk = (p: Predicate): boolean => {
    if (isComparison(p)) {
      const t = compare(p, situation);
      trace.push(t);
      return t.result;
    }
    // Deliberately NOT short-circuiting. `every`/`some` would stop at the first
    // decisive branch, leaving the trace incomplete — and the trace is what the
    // UI uses to explain why a heuristic did *not* fire. Correctness of the
    // explanation is worth evaluating a handful of extra comparisons.
    if ("all" in p) return p.all.map(walk).every(Boolean);
    if ("any" in p) return p.any.map(walk).some(Boolean);
    return !walk(p.not);
  };

  return { result: walk(predicate), trace };
}

/** Human-readable rendering of a predicate, for docs and UI tooltips. */
export function describe(predicate: Predicate): string {
  if (isComparison(predicate)) {
    const value = Array.isArray(predicate.value)
      ? `[${predicate.value.join(", ")}]`
      : predicate.value;
    const ops: Record<string, string> = {
      eq: "is",
      neq: "is not",
      lt: "<",
      lte: "≤",
      gt: ">",
      gte: "≥",
      in: "in",
    };
    return `${predicate.dim} ${ops[predicate.op]} ${value}`;
  }
  if ("all" in predicate) return `(${predicate.all.map(describe).join(" AND ")})`;
  if ("any" in predicate) return `(${predicate.any.map(describe).join(" OR ")})`;
  return `NOT ${describe(predicate.not)}`;
}
