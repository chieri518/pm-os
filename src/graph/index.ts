import type {
  Archetype,
  CompanyLens,
  Concept,
  Framework,
  Heuristic,
  QuestionType,
  Situation,
} from "../schema/nodes";
import { isExperienceHeuristic } from "../schema/nodes";
import type { Edge, RelationType } from "../schema/edges";
import { SYMMETRIC_RELATIONS } from "../schema/edges";
import { NodeRef, NodeType, refKey } from "../schema/primitives";
import { evaluate, type Trace } from "./predicate";

/** A stage/beat/dimension/factor lifted out of its framework so edges can target it. */
export type FrameworkPart = {
  id: string;
  name: string;
  prompt: string;
  framework_id: string;
  framework_kind: Framework["kind"];
  part_kind: "stage" | "beat" | "dimension" | "factor";
  order?: number;
  expected_duration_pct?: number;
  key_questions?: string[];
  example_metrics?: string[];
  scale?: string;
  weight?: number;
};

type AnyNode =
  | Framework
  | Heuristic
  | Situation
  | Archetype
  | CompanyLens
  | QuestionType
  | Concept
  | FrameworkPart;

export interface HeuristicHit {
  heuristic: Heuristic;
  trace: Trace[];
  curated?: Edge;
  /** Whether the predicate evaluated true for this situation. */
  fires: boolean;
}

/** The serialized graph shipped to the browser. Plain JSON — no class instances. */
export interface GraphBundle {
  frameworks: Framework[];
  parts: FrameworkPart[];
  heuristics: Heuristic[];
  situations: Situation[];
  archetypes: Archetype[];
  lenses: CompanyLens[];
  questionTypes: QuestionType[];
  concepts: Concept[];
  edges: Edge[];
}

const DIR_TO_TYPE = {
  frameworks: "framework",
  heuristics: "heuristic",
  situations: "situation",
  archetypes: "archetype",
  lenses: "company_lens",
  questions: "question_type",
  concepts: "concept",
} as const satisfies Record<string, NodeType>;

/**
 * In-memory graph. Everything downstream — pages, practice builder, CLI — queries
 * through this interface, so the backing store stays swappable.
 */
export class GraphIndex {
  private nodes = new Map<string, AnyNode>();
  private files = new Map<string, string>();
  private edges: { edge: Edge; file: string }[] = [];
  private outgoing = new Map<string, Edge[]>();
  private incoming = new Map<string, Edge[]>();

  addNode(dir: keyof typeof DIR_TO_TYPE, node: AnyNode, file: string): void {
    const key = `${DIR_TO_TYPE[dir]}:${(node as { id: string }).id}`;
    this.nodes.set(key, node);
    this.files.set(key, file);
  }

  addPart(part: FrameworkPart): void {
    this.nodes.set(`framework_part:${part.id}`, part);
  }

  addEdge(edge: Edge, file: string): void {
    this.edges.push({ edge, file });
    const push = (map: Map<string, Edge[]>, key: string) => {
      const list = map.get(key);
      if (list) list.push(edge);
      else map.set(key, [edge]);
    };
    push(this.outgoing, refKey(edge.from));
    push(this.incoming, refKey(edge.to));
    // Symmetric relations are indexed both ways so traversal need not care.
    if (SYMMETRIC_RELATIONS.has(edge.relation)) {
      push(this.outgoing, refKey(edge.to));
      push(this.incoming, refKey(edge.from));
    }
  }

  has(ref: NodeRef): boolean {
    return this.nodes.has(refKey(ref));
  }

  fileOf(ref: NodeRef): string | undefined {
    return this.files.get(refKey(ref));
  }

  get<T extends AnyNode>(type: NodeType, id: string): T | undefined {
    return this.nodes.get(`${type}:${id}`) as T | undefined;
  }

  /** Throwing accessor for call sites where a missing node is a programmer error. */
  expect<T extends AnyNode>(type: NodeType, id: string): T {
    const node = this.get<T>(type, id);
    if (!node) throw new Error(`no ${type} with id "${id}"`);
    return node;
  }

  private all<T extends AnyNode>(type: NodeType): T[] {
    return [...this.nodes.entries()]
      .filter(([key]) => key.startsWith(`${type}:`))
      .map(([, node]) => node as T);
  }

  frameworks = (): Framework[] => this.all<Framework>("framework");
  heuristics = (): Heuristic[] => this.all<Heuristic>("heuristic");
  situations = (): Situation[] => this.all<Situation>("situation");
  archetypes = (): Archetype[] =>
    this.all<Archetype>("archetype").sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  lenses = (): CompanyLens[] => this.all<CompanyLens>("company_lens");
  questionTypes = (): QuestionType[] =>
    this.all<QuestionType>("question_type").sort((a, b) => a.order - b.order);
  concepts = (): Concept[] => this.all<Concept>("concept").sort((a, b) => a.order - b.order);
  edgeEntries = (): { edge: Edge; file: string }[] => this.edges;

  edgesFrom(ref: NodeRef, relation?: RelationType): Edge[] {
    const list = this.outgoing.get(refKey(ref)) ?? [];
    return relation ? list.filter((e) => e.relation === relation) : list;
  }

  edgesTo(ref: NodeRef, relation?: RelationType): Edge[] {
    const list = this.incoming.get(refKey(ref)) ?? [];
    return relation ? list.filter((e) => e.relation === relation) : list;
  }

  /** Resolve the far end of a symmetric edge relative to a known node. */
  otherEnd(edge: Edge, from: NodeRef): NodeRef {
    return refKey(edge.from) === refKey(from) ? edge.to : edge.from;
  }

  /* ---------------------------------------------------------------- *
   * Serialization — the browser seam.
   *
   * `toBundle` is called at build time by a Node script and `fromBundle` rehydrates
   * the same class from plain JSON, so a serialized graph and a freshly loaded one
   * are interchangeable. One implementation of every query.
   * ---------------------------------------------------------------- */

  toBundle(): GraphBundle {
    return {
      frameworks: this.frameworks(),
      parts: this.all<FrameworkPart>("framework_part"),
      heuristics: this.heuristics(),
      situations: this.situations(),
      archetypes: this.archetypes(),
      lenses: this.lenses(),
      questionTypes: this.questionTypes(),
      concepts: this.concepts(),
      edges: this.edges.map(({ edge }) => edge),
    };
  }

  static fromBundle(bundle: GraphBundle): GraphIndex {
    const graph = new GraphIndex();
    for (const f of bundle.frameworks) graph.addNode("frameworks", f, "<bundle>");
    for (const h of bundle.heuristics) graph.addNode("heuristics", h, "<bundle>");
    for (const s of bundle.situations) graph.addNode("situations", s, "<bundle>");
    for (const a of bundle.archetypes) graph.addNode("archetypes", a, "<bundle>");
    for (const l of bundle.lenses) graph.addNode("lenses", l, "<bundle>");
    for (const q of bundle.questionTypes ?? []) graph.addNode("questions", q, "<bundle>");
    for (const c of bundle.concepts ?? []) graph.addNode("concepts", c, "<bundle>");
    for (const p of bundle.parts) graph.addPart(p);
    for (const e of bundle.edges) graph.addEdge(e, "<bundle>");
    return graph;
  }

  stats() {
    return {
      frameworks: this.frameworks().length,
      framework_parts: this.all("framework_part").length,
      heuristics: this.heuristics().length,
      situations: this.situations().length,
      archetypes: this.archetypes().length,
      lenses: this.lenses().length,
      question_types: this.questionTypes().length,
      concepts: this.concepts().length,
      edges: this.edges.length,
    };
  }

  /* ---------------------------------------------------------------- *
   * Queries — the reason the schema exists.
   * ---------------------------------------------------------------- */

  /**
   * Which heuristics fire in this situation, and why.
   *
   * Note the direction: we evaluate each heuristic's predicate against the
   * SITUATION. Archetypes never appear here. That is the whole point of the
   * two-layer split — one archetype in two situations gets two different answers.
   */
  applicableHeuristics(situationId: string): HeuristicHit[] {
    return this.applicableFor(this.expect<Situation>("situation", situationId), situationId).filter(
      (h) => h.fires
    );
  }

  /**
   * The same query against an ARBITRARY situation vector — one the user has built
   * assembled for a practice scenario, which exists nowhere in the content. This is
   * the reason situations are a value type rather than only a stored entity.
   */
  applicableFor(situation: Situation, curatedFor?: string): HeuristicHit[] {
    const hits: HeuristicHit[] = [];

    for (const heuristic of this.heuristics()) {
      // Decision heuristics act on the PM's reasoning, not on the user's context,
      // so they are never situationally applicable. They surface via SURFACES_AT.
      if (!isExperienceHeuristic(heuristic)) continue;
      const { result, trace } = evaluate(heuristic.applies_when, situation);
      const curated = curatedFor
        ? this.edgesFrom({ type: "heuristic", id: heuristic.id }, "APPLIES_TO").find(
            (e) => e.to.id === curatedFor
          )
        : undefined;
      hits.push({ heuristic, trace, curated, fires: result });
    }
    // Callers that only want the firing set filter on `fires`; keeping the misses
    // lets a caller show what is *nearly* true and what a small change would switch on.
    return hits;
  }

  /** Tensions among a given set of heuristics — the pairs a candidate must resolve out loud. */
  tensionsAmong(heuristicIds: string[]): { a: Heuristic; b: Heuristic; edge: Edge }[] {
    const present = new Set(heuristicIds);
    const seen = new Set<string>();
    const out: { a: Heuristic; b: Heuristic; edge: Edge }[] = [];

    for (const { edge } of this.edges) {
      if (edge.relation !== "TENSIONS_WITH") continue;
      if (!present.has(edge.from.id) || !present.has(edge.to.id)) continue;
      const key = [edge.from.id, edge.to.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        a: this.expect<Heuristic>("heuristic", edge.from.id),
        b: this.expect<Heuristic>("heuristic", edge.to.id),
        edge,
      });
    }
    return out;
  }

  /** Framework parts ranked by how much a given company lens weights them. */
  weightedParts(lensId: string, frameworkId: string): { part: FrameworkPart; weight: number; edge: Edge }[] {
    return this.edgesFrom({ type: "company_lens", id: lensId }, "WEIGHTS")
      .map((edge) => ({ edge, part: this.get<FrameworkPart>("framework_part", edge.to.id) }))
      .filter((row): row is { edge: Edge; part: FrameworkPart } => row.part?.framework_id === frameworkId)
      .map(({ edge, part }) => ({ part, weight: edge.weight ?? 0, edge }))
      .sort((x, y) => y.weight - x.weight);
  }

  /** Where in an answer a heuristic should be deployed. */
  surfacesAt(heuristicId: string): { part: FrameworkPart; edge: Edge }[] {
    return this.edgesFrom({ type: "heuristic", id: heuristicId }, "SURFACES_AT")
      .map((edge) => ({ edge, part: this.get<FrameworkPart>("framework_part", edge.to.id) }))
      .filter((row): row is { edge: Edge; part: FrameworkPart } => Boolean(row.part));
  }
}

export { NodeType };
