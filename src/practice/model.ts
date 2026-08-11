import type { GraphIndex, FrameworkPart } from "../graph/index";
import type { Archetype, Concept, Heuristic, Situation } from "../schema/nodes";
import { evaluate } from "../graph/predicate";

/**
 * A purpose-built view model for the practice builder.
 *
 * The client needs to recompute a scenario whenever the user changes the question
 * type, the company, or the user context — so the data has to be in the browser.
 * But it needs a fraction of the graph, and none of the teaching prose. Assembling
 * a tailored payload here keeps the client bundle small and, more importantly,
 * gives the practice UI a shape that matches what it renders instead of making it
 * traverse a general-purpose graph on every keystroke.
 */

export interface PracticeQuestionType {
  id: string;
  name: string;
  family: string;
  prompts: string[];
  contextPrompts: string[];
  approachTitles: string[];
  pitfalls: { mistake: string; instead: string }[];
  frameworkIds: string[];
  conceptRefs: { id: string; name: string }[];
}

export interface PracticeFramework {
  id: string;
  name: string;
  stages: { id: string; name: string; prompt: string; defaultPct: number }[];
}

export interface PracticeLens {
  id: string;
  company: string;
  /** partId -> weight. Empty when this lens has no weights for the framework. */
  stageWeights: Record<string, number>;
  strongSignals: string[];
  redFlags: string[];
}

export interface PracticeHeuristic {
  id: string;
  name: string;
  implication: string;
  applies_when: unknown;
}

export interface PracticeData {
  questionTypes: PracticeQuestionType[];
  frameworks: PracticeFramework[];
  lenses: PracticeLens[];
  archetypes: Archetype[];
  situations: Situation[];
  heuristics: PracticeHeuristic[];
  tensions: { a: string; b: string; aName: string; bName: string; rationale: string }[];
}

export function buildPracticeData(graph: GraphIndex): PracticeData {
  const proceduralFrameworks = graph.frameworks().filter((f) => f.kind === "procedural");

  return {
    questionTypes: graph.questionTypes().map((q) => {
      const ref = { type: "question_type" as const, id: q.id };
      return {
        id: q.id,
        name: q.name,
        family: q.family,
        prompts: q.sample_questions,
        contextPrompts: q.context_prompts,
        approachTitles: q.approach.map((s) => s.title),
        pitfalls: q.pitfalls,
        frameworkIds: graph
          .edgesFrom(ref, "ANSWERED_WITH")
          .sort((a, b) => b.strength - a.strength)
          .map((e) => e.to.id),
        conceptRefs: graph
          .edgesFrom(ref, "REQUIRES")
          .sort((a, b) => b.strength - a.strength)
          .map((e) => ({ id: e.to.id, name: graph.get<Concept>("concept", e.to.id)?.name ?? e.to.id }))
          .filter((c) => Boolean(c.name)),
      };
    }),

    frameworks: proceduralFrameworks.map((f) => ({
      id: f.id,
      name: f.name,
      stages: f.kind === "procedural"
        ? f.stages
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((s) => ({
              id: s.id,
              name: s.name,
              prompt: s.prompt,
              defaultPct: s.expected_duration_pct,
            }))
        : [],
    })),

    lenses: graph.lenses().map((l) => {
      const stageWeights: Record<string, number> = {};
      for (const edge of graph.edgesFrom({ type: "company_lens", id: l.id }, "WEIGHTS")) {
        if (edge.weight !== undefined) stageWeights[edge.to.id] = edge.weight;
      }
      return {
        id: l.id,
        company: l.company,
        stageWeights,
        strongSignals: l.rubric.map((r) => r.strong_signal),
        redFlags: l.red_flags,
      };
    }),

    archetypes: graph.archetypes(),
    situations: graph.situations(),

    heuristics: graph
      .heuristics()
      .filter((h) => h.scope === "experience")
      .map((h) => ({
        id: h.id,
        name: h.name,
        implication: h.implication,
        applies_when: h.scope === "experience" ? h.applies_when : undefined,
      })),

    tensions: graph
      .edgeEntries()
      .filter(({ edge }) => edge.relation === "TENSIONS_WITH")
      .map(({ edge }) => ({
        a: edge.from.id,
        b: edge.to.id,
        aName: graph.get<Heuristic>("heuristic", edge.from.id)?.name ?? edge.from.id,
        bName: graph.get<Heuristic>("heuristic", edge.to.id)?.name ?? edge.to.id,
        rationale: edge.rationale,
      })),
  };
}

/* ------------------------------------------------------------------ *
 * Scenario assembly — pure, runs in the browser on every change.
 * ------------------------------------------------------------------ */

export interface Selection {
  questionTypeId: string;
  lensId: string | null;
  archetypeId: string | null;
  situationId: string | null;
  promptIndex: number;
  sessionMinutes: number;
}

export interface ScenarioStage {
  id: string;
  name: string;
  prompt: string;
  /** Share of the session, after the lens has had its say. */
  pct: number;
  targetSec: number;
  cumulativeSec: number;
  /** Percentage points the lens adds or removes versus the framework default. */
  divergence: number;
}

export interface Check {
  source: string;
  text: string;
}

export interface Scenario {
  prompt: string;
  contextLine: string | null;
  framework: PracticeFramework | null;
  stages: ScenarioStage[];
  totalSec: number;
  liveHeuristics: { id: string; name: string; implication: string; why: string }[];
  tensions: { aName: string; bName: string; rationale: string }[];
  checks: Check[];
  conceptRefs: { id: string; name: string }[];
}

/** Product-family questions get a user context; the others do not need one. */
export const needsUserContext = (family: string) => family === "product";

export function buildScenario(data: PracticeData, sel: Selection): Scenario | null {
  const q = data.questionTypes.find((x) => x.id === sel.questionTypeId);
  if (!q) return null;

  const lens = data.lenses.find((l) => l.id === sel.lensId) ?? null;
  const framework =
    data.frameworks.find((f) => q.frameworkIds.includes(f.id)) ?? null;

  const archetype = data.archetypes.find((a) => a.id === sel.archetypeId) ?? null;
  const situation = data.situations.find((s) => s.id === sel.situationId) ?? null;
  const useContext = needsUserContext(q.family) && archetype && situation;

  // With a user context bound, draw from the open prompts; otherwise use the
  // self-contained sample questions, which already name their own user.
  const canBind = useContext && q.contextPrompts.length > 0;
  const pool = canBind ? q.contextPrompts : q.prompts;
  const basePrompt = pool[sel.promptIndex % pool.length] ?? pool[0]!;
  const prompt = canBind
    ? `${basePrompt.replace(/[.?]$/, "")} — for a ${archetype.name.toLowerCase()}, ${situation.label.toLowerCase()}.`
    : basePrompt;

  const totalSec = sel.sessionMinutes * 60;

  /**
   * Time is allocated by the company's rubric weight where one exists, not by the
   * framework's own default. That is the whole point: CIRCLES allots 15% of an
   * answer to Identify, but Meta weights it 30% — so practising to the framework
   * default systematically underspends on the stage that carries the most points.
   */
  let stages: ScenarioStage[] = [];
  if (framework) {
    const weights = framework.stages.map((s) => {
      const lensWeight = lens?.stageWeights[s.id];
      return { stage: s, pct: lensWeight ?? s.defaultPct };
    });
    const sum = weights.reduce((acc, w) => acc + w.pct, 0) || 100;
    let cumulative = 0;
    stages = weights.map(({ stage, pct }) => {
      const normalised = (pct / sum) * 100;
      const targetSec = Math.round((normalised / 100) * totalSec);
      cumulative += targetSec;
      return {
        id: stage.id,
        name: stage.name,
        prompt: stage.prompt,
        pct: Math.round(normalised),
        targetSec,
        cumulativeSec: cumulative,
        divergence: Math.round(normalised - stage.defaultPct),
      };
    });
  }

  const liveHeuristics = situation
    ? data.heuristics
        .map((h) => {
          const { result, trace } = evaluate(
            h.applies_when as Parameters<typeof evaluate>[0],
            situation
          );
          const fired = trace.filter((t) => t.result);
          return {
            id: h.id,
            name: h.name,
            implication: h.implication,
            why: fired.map((t) => `${t.expr} → ${t.actual}`).join(", "),
            result,
          };
        })
        .filter((h) => h.result)
        .map(({ result: _result, ...rest }) => rest)
    : [];

  const liveIds = new Set(liveHeuristics.map((h) => h.id));
  const seen = new Set<string>();
  const tensions = data.tensions
    .filter((t) => liveIds.has(t.a) && liveIds.has(t.b))
    .filter((t) => {
      const key = [t.a, t.b].sort().join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ aName, bName, rationale }) => ({ aName, bName, rationale }));

  /**
   * The rubric is assembled from content that already exists elsewhere: what this
   * question type punishes, and what this company rewards. Nothing here is
   * authored twice — which is the payoff of putting rationale on the edges.
   */
  const checks: Check[] = [
    ...q.pitfalls.slice(0, 4).map((p) => ({ source: q.name, text: p.instead })),
    ...(lens ? lens.strongSignals.slice(0, 3).map((s) => ({ source: lens.company, text: s })) : []),
  ];

  const contextLine = canBind
    ? `${archetype.name} · ${situation.label} · ${situation.device}, ${situation.hands_free} hand(s), ${situation.time_budget_sec}s, load ${situation.cognitive_load}, stakes ${situation.stakes}`
    : null;

  return {
    prompt,
    contextLine,
    framework,
    stages,
    totalSec,
    liveHeuristics,
    tensions,
    checks,
    conceptRefs: q.conceptRefs,
  };
}
