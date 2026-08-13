import { z } from "zod";
import {
  Citation,
  Device,
  EvidenceStrength,
  Level,
  Predicate,
  Slug,
} from "./primitives";

/* ------------------------------------------------------------------ *
 * FRAMEWORK TEACHING — a different shape from heuristic teaching.
 *
 * A heuristic is a claim you either believe or don't, so its teaching turns on
 * mechanism and evidence. A framework is a STRUCTURE you either reach for or
 * don't, so its teaching turns on fit: when to use it, when it actively misleads,
 * and what a real answer sounds like walking through it beat by beat.
 * ------------------------------------------------------------------ */

export const FrameworkTeaching = z.object({
  in_one_line: z.string(),
  /** Why this particular decomposition, rather than some other one. */
  why_this_structure: z.string(),
  when_to_use: z.array(z.string()).min(1),
  /** The half most prep material omits — and where candidates lose points. */
  when_not_to_use: z.array(z.string()).min(1),
  worked_walkthrough: z.object({
    question: z.string(),
    beats: z
      .array(
        z.object({
          /** Framework part id, e.g. "circles.identify". */
          part_id: Slug,
          say: z.string(),
        })
      )
      .min(1),
  }),
  failure_modes: z
    .array(z.object({ mistake: z.string(), instead: z.string() }))
    .min(1),
});
export type FrameworkTeaching = z.infer<typeof FrameworkTeaching>;

/* ------------------------------------------------------------------ *
 * FRAMEWORKS — a discriminated union, not one flat table.
 *
 * CIRCLES (procedural), STAR (narrative), AARRR (taxonomic) and RICE
 * (calculative) are structurally different objects. Only procedural
 * frameworks have ordered stages and time budgets, which is precisely
 * what the future feedback engine needs to say "you spent 4 minutes in
 * Comprehend and 40 seconds in Solutions". Collapsing them into one
 * shape would silently make that feature impossible.
 * ------------------------------------------------------------------ */

const PartBase = z.object({
  /** Composite id, e.g. "circles.comprehend" — globally unique across frameworks. */
  id: Slug,
  name: z.string(),
  prompt: z.string(),
});

export const ProceduralStage = PartBase.extend({
  order: z.number().int().min(1),
  /** Share of total answer time this stage should consume. Stages must sum to 100. */
  expected_duration_pct: z.number().min(0).max(100),
  key_questions: z.array(z.string()).default([]),
});

export const NarrativeBeat = PartBase.extend({
  order: z.number().int().min(1),
});

export const TaxonomicDimension = PartBase.extend({
  example_metrics: z.array(z.string()).default([]),
});

export const CalculativeFactor = PartBase.extend({
  scale: z.string(),
  weight: z.number().optional(),
});

const FrameworkBase = z.object({
  id: Slug,
  name: z.string(),
  aka: z.array(z.string()).default([]),
  summary: z.string(),
  best_for: z.array(z.string()).default([]),
  /** Optional so the corpus grows incrementally; the validator warns on gaps. */
  teaching: FrameworkTeaching.optional(),
  source: Citation.optional(),
});

export const Framework = z.discriminatedUnion("kind", [
  FrameworkBase.extend({ kind: z.literal("procedural"), stages: z.array(ProceduralStage).min(1) }),
  FrameworkBase.extend({ kind: z.literal("narrative"), beats: z.array(NarrativeBeat).min(1) }),
  FrameworkBase.extend({
    kind: z.literal("taxonomic"),
    dimensions: z.array(TaxonomicDimension).min(1),
  }),
  FrameworkBase.extend({
    kind: z.literal("calculative"),
    factors: z.array(CalculativeFactor).min(1),
  }),
]);
export type Framework = z.infer<typeof Framework>;

/* ------------------------------------------------------------------ *
 * SITUATION — layer 2 of the archetype split. What is true RIGHT NOW.
 * Heuristics bind to predicates over THESE fields.
 * ------------------------------------------------------------------ */

export const Situation = z.object({
  id: Slug,
  label: z.string(),
  narrative: z.string(),
  device: Device,
  /** How many hands the user actually has available. */
  hands_free: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  time_budget_sec: z.number().int().positive(),
  cognitive_load: Level,
  /** Fogg's two axes, first-class rather than buried in prose. */
  motivation: Level,
  ability: Level,
  /** What the user stands to lose if this goes wrong. Added to unblock loss aversion. */
  stakes: Level,
});
export type Situation = z.infer<typeof Situation>;

/* ------------------------------------------------------------------ *
 * ARCHETYPE — layer 1. Slow-moving identity. Generates likely situations
 * but never binds to heuristics directly.
 * ------------------------------------------------------------------ */

export const Archetype = z.object({
  id: Slug,
  name: z.string(),
  /** Display ordering. Without it, presentation order follows filesystem read order. */
  order: z.number().int().default(100),
  age_band: z.string(),
  life_stage: z.string(),
  role: z.string(),
  tech_literacy: Level,
  /** What they are trying to move toward. */
  drivers: z.array(z.string()).min(1),
  /** What they trade off when forced to choose. Format: "reliability > novelty". */
  values: z.array(z.string()).min(1),
  /** Tactical, in-the-moment annoyances. Distinct from drivers/values by design. */
  frictions: z.array(z.string()).default([]),
  /** Situations this archetype is commonly in. Many-to-many: situations are shared. */
  typical_situations: z.array(Slug).min(1),
});
export type Archetype = z.infer<typeof Archetype>;

/* ------------------------------------------------------------------ *
 * HEURISTIC — a claim plus the conditions under which it fires.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * TEACHING — the learning layer.
 *
 * A reference that only states claims serves people who already know the rules.
 * This block is the on-ramp, and its shape is deliberately opinionated:
 *
 *   `mechanism` comes before any application, because knowing WHY something
 *   works is what lets you judge when it does not. Without it we are a
 *   flashcard deck with citations.
 *
 *   `strong_sounds_like` / `weak_sounds_like` are separate fields because the
 *   GAP between them is the actual lesson — and the pair doubles as scoring
 *   exemplars for the interview engine later.
 *
 *   `in_daily_life` is not filler. It is the retrieval hook. Nobody recalls
 *   "logarithmic choice reaction time" under pressure; they recall the diner menu.
 * ------------------------------------------------------------------ */

export const WorkedExample = z.object({
  situation: z.string(),
  /** The naive approach and what it costs. */
  without: z.string(),
  /** The approach the concept suggests. */
  with: z.string(),
  takeaway: z.string(),
});

export const InterviewUse = z.object({
  how_to_deploy: z.string(),
  strong_sounds_like: z.string(),
  weak_sounds_like: z.string(),
});

export const Teaching = z.object({
  in_one_line: z.string(),
  /** Why it works — the causal story, not the restated claim. */
  mechanism: z.string(),
  in_interview: InterviewUse,
  in_product_work: z.string(),
  in_daily_life: z.string(),
  worked_example: WorkedExample,
});
export type Teaching = z.infer<typeof Teaching>;

const HeuristicBase = z.object({
  id: Slug,
  name: z.string(),
  aka: z.array(z.string()).default([]),
  claim: z.string(),
  /** The design or decision move this heuristic tells you to make. */
  implication: z.string(),
  evidence_strength: EvidenceStrength,
  /** Where the real research stops. Required for anything not fully replicated. */
  caveat: z.string().optional(),
  /**
   * The confident wrong version candidates repeat in interviews. Encoded as
   * first-class content because knowing the misuse is what separates a candidate
   * who has read the paper from one who has read a listicle.
   */
  common_misapplication: z.string().optional(),
  /** Optional so the corpus can grow incrementally; the validator warns on gaps. */
  teaching: Teaching.optional(),
  source: Citation.optional(),
});

/**
 * Heuristics come in two scopes, and conflating them was a modelling bug.
 *
 * `experience` heuristics act on a USER IN A SITUATION (Hick's, Fogg, Peak-End).
 * They carry a predicate and fire situationally.
 *
 * `decision` heuristics act on the PM'S OWN REASONING (Type 1 / Type 2 doors).
 * A predicate over user context is meaningless for them — they attach to
 * framework parts via SURFACES_AT edges instead, because they belong to a moment
 * in your ANSWER, not to a moment in the user's day.
 */
export const Heuristic = z.discriminatedUnion("scope", [
  HeuristicBase.extend({ scope: z.literal("experience"), applies_when: Predicate }),
  HeuristicBase.extend({ scope: z.literal("decision") }),
]);
export type Heuristic = z.infer<typeof Heuristic>;

/** Narrowing helper — `applies_when` only exists on experience heuristics. */
export const isExperienceHeuristic = (
  h: Heuristic
): h is Extract<Heuristic, { scope: "experience" }> => h.scope === "experience";

/* ------------------------------------------------------------------ *
 * QUESTION TYPE — the taxonomy of what you actually get asked.
 *
 * This is the node a candidate reaches for first: they do not think "I need a
 * procedural framework", they think "I've been asked to design a product".
 * Everything else in the graph hangs off this entry point.
 * ------------------------------------------------------------------ */

export const QuestionType = z.object({
  id: Slug,
  name: Slug.or(z.string()),
  order: z.number().int().default(100),
  family: z.enum(["behavioral", "product", "analytical", "technical"]),
  /** The literal phrasings this shows up as in a real interview. */
  prompt_forms: z.array(z.string()).min(1),
  /** What the interviewer is actually scoring. */
  what_is_tested: z.array(z.string()).min(1),
  approach: z
    .array(
      z.object({
        step: z.number().int().min(1),
        title: z.string(),
        detail: z.string(),
      })
    )
    .min(1),
  time_guidance: z.string().optional(),
  pitfalls: z.array(z.object({ mistake: z.string(), instead: z.string() })).min(1),
  sample_questions: z.array(z.string()).min(1),
  /**
   * Prompts deliberately left open about WHO the user is, so a practice session
   * can bind an archetype and situation to them. `sample_questions` cannot be used
   * this way — most already name their own user ("design an alarm clock for the
   * blind"), and appending a second user produces an incoherent prompt.
   */
  context_prompts: z.array(z.string()).default([]),
  teaching: Teaching.optional(),
});
export type QuestionType = z.infer<typeof QuestionType>;


/* ------------------------------------------------------------------ *
 * CONCEPT — the taught body of knowledge.
 *
 * Distinct from the other node types on purpose. A framework is a STRUCTURE you
 * reach for; a heuristic is a CLAIM you either believe or not; a question type is
 * a SITUATION you find yourself in. A concept is a SUBJECT you are expected to
 * already know — segmentation, unit economics, experiment design — the material a
 * product-management degree spends a term on.
 *
 * `layers` is the shape that matters. The same subject has to serve someone
 * meeting it for the first time and someone being pushed on it by a staff PM two
 * follow-ups deep, so each concept is authored at three explicit depths rather
 * than at one compromise depth that serves neither.
 * ------------------------------------------------------------------ */

export const ConceptLayer = z.object({
  /**
   * orientation — what it is and why anyone cares, for a first encounter.
   * working    — how to actually use it, with the mechanics and the numbers.
   * expert     — where it breaks, what the arguments are, what the follow-up probes.
   */
  level: z.enum(["orientation", "working", "expert"]),
  title: z.string(),
  body: z.string(),
});

export const Formula = z.object({
  name: z.string(),
  expression: z.string(),
  notes: z.string().optional(),
});

export const Concept = z.object({
  id: Slug,
  name: z.string(),
  order: z.number().int().default(100),
  domain: z.enum([
    "customer",
    "strategy",
    "economics",
    "experimentation",
    "metrics",
    "process",
    "technical",
    "analytical",
  ]),
  in_one_line: z.string(),
  why_it_matters: z.string(),
  layers: z.array(ConceptLayer).min(2),
  formulas: z.array(Formula).default([]),
  worked_example: z.object({
    situation: z.string(),
    steps: z.array(z.string()).min(1),
    takeaway: z.string(),
  }),
  common_errors: z.array(z.object({ mistake: z.string(), instead: z.string() })).min(1),
  in_interview: InterviewUse,
  /**
   * Required, not optional. Several of the most confidently taught quantities in
   * product management — the 3:1 LTV:CAC rule, NPS, the 40% PMF test — rest on
   * far thinner foundations than their repetition implies. Forcing an evidence
   * verdict on every concept is what keeps this from becoming another listicle.
   */
  evidence: z.object({
    strength: EvidenceStrength,
    note: z.string(),
  }),
  sources: z.array(Citation).default([]),
});
export type Concept = z.infer<typeof Concept>;


/* ------------------------------------------------------------------ *
 * TERM — the glossary layer.
 *
 * Deliberately NOT a Concept. A concept is a subject you study — it earns three
 * depth layers, formulas, an evidence verdict, and a worked example. A term is a
 * word you need in order to parse a sentence. Conflating them would either bloat
 * the glossary into fifty more study pages or dilute what a concept means.
 *
 * The corpus needs this because it was written fluently for someone who already
 * had the vocabulary: "segment" appears 95 times, "cohort" 40, "guardrail" 22 —
 * roughly 540 uses of ~50 undefined terms. Terms are also what make dense inline
 * linking possible at all; without them there are only 68 link targets.
 * ------------------------------------------------------------------ */

export const Term = z.object({
  id: Slug,
  name: z.string(),
  /** Alternate spellings and abbreviations. Used by the auto-linker. */
  aka: z.array(z.string()).default([]),
  domain: z.enum([
    "customer",
    "strategy",
    "economics",
    "experimentation",
    "metrics",
    "process",
    "technical",
    "analytical",
  ]),
  /** One sentence. This is what a hover preview shows. */
  one_line: z.string(),
  definition: z.string(),
  formula: z.string().optional(),
  /** The confusion this term most often causes. */
  watch_out: z.string().optional(),
  see_also: z.array(Slug).default([]),
});
export type Term = z.infer<typeof Term>;


/* ------------------------------------------------------------------ *
 * INTERVIEW GUIDE — the interviewer's side of the table.
 *
 * Every prep site publishes questions and model answers. Almost none publish what
 * the person opposite you is holding, because real calibration guides are internal
 * and confidential. That absence is the gap this node fills.
 *
 * IMPORTANT, and rendered on the page rather than buried: these guides are
 * CONSTRUCTED from published evaluation criteria. They are not reproductions of
 * any company's internal material, and they carry `estimate` provenance. A repo
 * whose whole argument is honesty about sourcing cannot then present invented
 * scoring sheets as though they were leaked ones.
 *
 * Scoring is a SIGNAL CHECKLIST rather than a 1-4 scale with anchors. Observable
 * behaviours — "named a guardrail metric", "classified the decision as reversible"
 * — are things two interviewers would agree happened or did not. Inventing level
 * anchors would imply a calibration we have no basis for.
 * ------------------------------------------------------------------ */

/**
 * The five competencies a product interview is trying to observe. Named centrally
 * so guides can declare coverage against a shared vocabulary rather than each
 * inventing its own.
 */
export const Competency = z.enum([
  "ambiguity-scoping",
  "segmentation",
  "jtbd-pain-points",
  "prioritisation-tradeoffs",
  "metrics-guardrails",
]);
export type Competency = z.infer<typeof Competency>;

/** A follow-up the interviewer holds in reserve, and what it is meant to reveal. */
export const Probe = z.object({
  /** When to reach for it. */
  trigger: z.string(),
  ask: z.string(),
  looking_for: z.string(),
});

/** Helping a stuck candidate without handing them the answer. */
export const Rescue = z.object({
  when: z.string(),
  offer: z.string(),
  /** Why this much help and no more — the line that keeps the signal intact. */
  hold_back: z.string(),
});

export const SignalGroup = z.object({
  dimension: z.string(),
  signals: z
    .array(
      z.object({
        /** Phrased so two interviewers would agree whether it happened. */
        observable: z.string(),
        note: z.string().optional(),
      })
    )
    .min(1),
});

export const InterviewGuide = z.object({
  id: Slug,
  /** The question type this guide instantiates. */
  question_type: Slug,
  order: z.number().int().default(100),
  question: z.string(),
  variants: z.array(z.string()).default([]),
  /** What signal the question is designed to elicit. */
  intent: z.string(),
  difficulty: z.enum(["warm-up", "standard", "stretch"]).default("standard"),
  duration_min: z.number().int().positive(),

  delivery: z.object({
    script: z.string(),
    setup: z.array(z.string()).default([]),
  }),

  /** Prepared answers to likely clarifying questions: what to reveal, what to withhold. */
  clarifying: z
    .array(z.object({ asks: z.string(), answer: z.string(), why: z.string().optional() }))
    .default([]),

  /** Where a candidate should be by when. Uses the framework's own pacing. */
  checkpoints: z.array(z.object({ at_min: z.number(), expect: z.string() })).default([]),

  probes: z.array(Probe).min(1),
  rescues: z.array(Rescue).default([]),

  signal_groups: z.array(SignalGroup).min(1),
  anti_signals: z
    .array(z.object({ observable: z.string(), note: z.string().optional() }))
    .default([]),

  /** What NOT to score on. Interview guides without these produce biased loops. */
  bias_guards: z.array(z.string()).min(1),

  /**
   * Which of the five core PM competencies this question actually exercises.
   *
   * Recorded honestly, including what it does NOT test. An estimation question
   * will not show you user segmentation, and pretending otherwise would pad the
   * guide and mislead someone planning a practice loop — the absences are what
   * tell you which second question to run.
   */
  competencies: z.object({
    core: z.array(Competency).default([]),
    light: z.array(Competency).default([]),
    not_tested: z.array(Competency).default([]),
  }),

  /**
   * Feedback prompts for the last five minutes. A mock interview whose value ends
   * at scoring has wasted most of its point — the debrief is the deliverable.
   * Plus/Delta rather than "strengths and weaknesses" because delta names a
   * specific change rather than a deficiency.
   */
  debrief: z.object({
    plus: z.array(z.string()).min(2),
    delta: z.array(z.string()).min(2),
    /** The single most common thing to tell someone after this question. */
    most_common: z.string(),
  }),

  /** How this guide was constructed, shown on the page. */
  basis: z.string(),
});
export type InterviewGuide = z.infer<typeof InterviewGuide>;

/* ------------------------------------------------------------------ *
 * COMPANY LENS — what a given company's rubric actually rewards.
 * ------------------------------------------------------------------ */

export const RubricDimension = z.object({
  id: Slug,
  name: z.string(),
  /** Relative weight within this lens. Dimensions must sum to 100. */
  weight: z.number().min(0).max(100),
  description: z.string(),
  strong_signal: z.string(),
});

/**
 * Where a claim came from. The whole point of this field is that the company
 * lenses used to be labelled "researched estimates" wholesale, which was honest
 * but useless — it gave a reader no way to tell Amazon's published Leadership
 * Principles (verbatim, from amazon.jobs) apart from our own guess at how much a
 * stage is weighted. Provenance is now per-source rather than per-page.
 */
export const SourceTier = z.enum([
  /** The company says this itself, in public, in writing. */
  "official",
  /** Consistently reported across many independent accounts; not first-party. */
  "corroborated",
  /** Our inference from the above. Explicitly not fact. */
  "estimate",
]);

export const LensSource = z.object({
  label: z.string(),
  url: z.string().url().optional(),
  year: z.number().int().optional(),
  tier: SourceTier,
});

/** A named value, principle, or attribute the company evaluates against. */
export const CompanyValue = z.object({
  name: z.string(),
  description: z.string(),
  /** What demonstrating it actually sounds like in an answer. */
  in_answers: z.string().optional(),
});

/** One stage of the interview loop. */
export const LoopStage = z.object({
  stage: z.string(),
  format: z.string(),
  duration_min: z.number().int().positive().optional(),
  tests: z.string(),
  note: z.string().optional(),
});

/**
 * Where widely repeated prep folklore disagrees with what the company actually
 * publishes. This is the highest-value field on the whole node: it is the only
 * place in the corpus where we can correct advice using a first-party source.
 */
export const LensMyth = z.object({
  common_advice: z.string(),
  reality: z.string(),
  source_tier: SourceTier,
});

export const CompanyLens = z.object({
  id: Slug,
  company: z.string(),
  order: z.number().int().default(100),
  round_types: z.array(z.string()).min(1),
  philosophy: z.string(),
  /** What the company calls its evaluation criteria, in its own vocabulary. */
  values_label: z.string().optional(),
  values: z.array(CompanyValue).default([]),
  loop: z.array(LoopStage).default([]),
  rubric: z.array(RubricDimension).min(1),
  red_flags: z.array(z.string()).default([]),
  sample_questions: z.array(z.string()).default([]),
  myths: z.array(LensMyth).default([]),
  /** Required. A lens with no sources is exactly the problem this replaced. */
  sources: z.array(LensSource).min(1),
});
export type CompanyLens = z.infer<typeof CompanyLens>;
export type LensSource = z.infer<typeof LensSource>;
export type LoopStage = z.infer<typeof LoopStage>;
