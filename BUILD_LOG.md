# Build Log

A running record of product and technical decisions in `pm-os`, written as they were
made rather than reconstructed afterwards.

---

## Milestone 1 — Core Data Architecture & Knowledge Graph

**Goal:** make one question answerable without hand-waving.

> *For a Meta Product Design round, for a time-poor new parent at 2am — which CIRCLES
> stage matters most, which heuristics apply, which two conflict, and why?*

The question was chosen as the forcing function before any schema was written. Pure
schema design cannot tell you whether a schema is right; a query it must satisfy can.

**Shipped:** 6 node types, 6 typed edge relations, a predicate evaluator, a validating
loader, and a CLI that answers the question above. 4 frameworks-worth of content across
3 framework kinds, 8 heuristics, 3 situations, 2 archetypes, 2 company lenses, 30 edges.

---

### Decision 1 — Frameworks are a discriminated union, not one table

**Context.** CIRCLES, STAR, AARRR, and RICE all get called "frameworks" in prep material.

**Decision.** Model them as four `kind`s with different shapes: `procedural` (ordered
stages with time budgets), `narrative` (ordered beats, no budgets), `taxonomic`
(unordered classification), `calculative` (input → score).

**Why.** Only procedural frameworks have a meaningful notion of *pacing*. The planned
feedback engine needs to say "you spent 4 minutes in Comprehend and 40 seconds in
Solutions" — which requires `expected_duration_pct` per stage. Flattening all four into
one shape would have silently made that feature impossible to build later, and the cost
would not have surfaced until Milestone 5.

**Trade-off accepted.** Every consumer must handle four shapes. Bought back with a
`framework_part` abstraction so edges attach to a uniform node type regardless of kind.

---

### Decision 2 — Heuristics bind to situations, never to archetypes

**The central architectural claim of the project.**

**Context.** The obvious model is `Archetype ↔ Heuristic` tags: "Hick's Law applies to
busy parents."

**Decision.** Split personas into two layers. `Archetype` holds slow-moving identity
(age band, life stage, drivers, values, frictions). `Situation` holds what is true right
now across seven dimensions. Heuristics carry a **predicate over situational
dimensions** and never reference an archetype at all. Archetypes reach heuristics only
by way of the situations they typically occupy.

**Why.** Hick's Law does not apply to a new parent. It applies to *anyone under high
cognitive load or a sub-two-minute time budget*. A new parent simply occupies that state
often — and does not occupy it on a Saturday morning.

**Verified.** The CLI's Control A runs one archetype through two situations:

```
2am one-handed reorder    → Fogg, Goal-Gradient, Hick's, Jakob's, Loss Aversion,
                            Miller's, Peak-End
Unhurried weekend planning → Goal-Gradient, Jakob's, Peak-End
delta: −fogg, −hicks, −loss-aversion, −millers
```

Same person. Four heuristics switch off. A flat tag table cannot produce that
distinction, and every downstream feature — the playground sliders, the feedback
engine's situational scoring — depends on it.

---

### Decision 3 — `rationale` is required on every edge

**Decision.** No edge may exist without a prose explanation of why it exists.
`TENSIONS_WITH` additionally fails validation unless the rationale contains resolution
guidance.

**Why.** This is what separates a knowledge graph from a tagging system. The rationale
string is consumed three ways: explanation copy in the playground, feedback copy in the
interview engine, and revision material for the candidate. Authored once on the edge,
read everywhere. Under a flat tag model, all three surfaces would have needed separately
authored copy that would drift apart.

**Enforced, not aspirational.** A `TENSIONS_WITH` edge whose rationale reads "they
conflict a lot" is rejected at load time — verified by deliberately introducing one.

---

### Decision 4 — Content-as-code, database-ready

**Decision.** Canonical content lives as validated YAML in `/content`. `loadGraph()`
compiles it into an in-memory `GraphIndex`. Everything downstream queries that interface
and never touches the filesystem.

**Why.** Authoring is the bottleneck at this stage, not querying. YAML is reviewable in
diffs, and the schema is forced to be explicit because Zod rejects anything sloppy. When
user data arrives (practice sessions, progress) the mapping to Postgres is 1:1 and only
`loadGraph()` is reimplemented. `applies_when` and `conditions` stay JSONB — they are
recursive trees never queried from SQL.

**Trade-off accepted.** We build and maintain a compiler. Worth it while the schema is
still moving.

---

### Two schema changes forced by writing real content

Both were discovered by authoring content against the schema, not by designing it. This
is the argument for the vertical-slice approach in miniature: neither would have surfaced
from another week of whiteboarding.

**A 7th situational dimension: `stakes`.** Loss aversion fires on what the user stands to
lose — unexpressible in the original six dimensions. The governing rule was "extend only
when a heuristic we actually want cannot be expressed," and this was the first genuine
case. One dimension added, earned rather than assumed.

**Heuristics have two scopes.** Type 1 / Type 2 doors is not a user-experience heuristic
at all. It operates on *the PM's own decision*, not on a user in a context, so
`applies_when` is meaningless for it. `Heuristic` became a discriminated union:
`experience` (carries a predicate, fires situationally) and `decision` (no predicate,
reaches the graph only via `SURFACES_AT` edges to framework stages). Conflating them
would have meant either a fake predicate or an entire class of PM reasoning heuristics
locked out of the model.

---

### Product decision — encode the caveats, not just the claims

Verification against primary sources found that three of eight heuristics are materially
misstated in most PM prep material:

| Heuristic | What prep material says | What the research says |
|---|---|---|
| **Miller's Law** | "menus should have 7±2 items" | Miller studied immediate recall of *unrelated items*, and called seven a rhetorical device. Cowan (2001) puts the real limit near **four chunks**. A persistent on-screen menu imposes no memory load at all. |
| **Hick's Law** | "fewer options is always faster" | Logarithmic only for *known, anticipated* options. Landauer & Nachbar showed serial scan-and-evaluate of unfamiliar options is **linear**. |
| **Loss aversion** | "losses hurt 2× as much, settled science" | **Actively disputed.** Gal & Rucker (2018) argue much of the evidence reflects inertia; Kahneman conceded it is context-dependent. A 2025 re-meta-analysis found it not robust. |

`caveat` and `common_misapplication` were therefore promoted to first-class schema
fields, and `evidence_strength` is a required enum (`replicated` / `supported` /
`heuristic` / `contested`). The validator warns on any non-replicated heuristic missing a
caveat.

**Why this is a product decision and not a pedantic one.** Citing loss aversion as
settled science in a 2026 interview is now a *credibility risk*, not a signal of
sophistication. The differentiated value of this tool over a listicle is knowing exactly
where the evidence stops. Being right is the feature.

---

### Sources consulted

- Cowan, N. (2001). *The magical number 4 in short-term memory.* Behavioral and Brain Sciences 24(1), 87–114.
- Gal, D. & Rucker, D. (2018). *The Loss of Loss Aversion: Will It Loom Larger Than Its Gain?* J. Consumer Psychology.
- Redelmeier, D. & Kahneman, D. (1996). *Patients' memories of painful medical treatments.* Pain 66(1).
- Proctor, R. & Schneider, D. (2018). *Hick's law for choice reaction time: a review.* QJEP.
- Kivetz, Urminsky & Zheng (2006). *The goal-gradient hypothesis resurrected.* JMR 43(1).
- Fogg, B. J. (2009). *A Behavior Model for Persuasive Design.* Persuasive '09.

---

### What Milestone 1 deliberately did not do

No UI, no database, no AI. The corpus is a seed slice sized to exercise the schema, not
to be comprehensive. Company lens weights are researched estimates of published rubrics,
not insider information, and are labelled as such.

**Next:** broaden the corpus until the schema breaks again — that break is the signal for
what Milestone 2 should actually be.

---

## Milestone 2 — The Archetype & Heuristic Playground

**Goal:** make the architectural claim from Milestone 1 *visible*. If "heuristics bind to
situations, not people" is true, a user should be able to feel it by dragging one slider.

**Shipped:** a Next.js 16 / React 19 playground where seven situational dimensions are
live controls, and the applicable heuristics, their firing conditions, their live tensions,
and their position in a company rubric all recompute on every change.

---

### Decision 5 — Predicates evaluate in the browser, not on the server

**Context.** The interaction is a slider drag. A network round-trip per tick would make it
useless — and a debounce would make it feel broken rather than fast.

**Decision.** Compile `/content` into a 37 kB JSON bundle at build time, ship it with the
JS, and rehydrate **the same `GraphIndex` class** in the browser via `fromBundle()`.

**Why this was cheap.** It cost one method pair (`toBundle`/`fromBundle`) because the
Milestone 1 split already put the only filesystem access in `loadGraph()`. The predicate
evaluator was pure by construction. There is exactly one implementation of
`applicableFor`, `tensionsAmong`, and `weightedParts`, and it runs in Node for the CLI and
in the browser for the playground.

**Trade-off accepted.** The whole corpus ships to every visitor. Fine at 37 kB; at 10× we
either split by archetype or move evaluation server-side behind the same interface —
which the interface already permits.

---

### Decision 6 — Situations became a value type, not only a stored entity

**The change the UI forced.** Milestone 1's query was `applicableHeuristics(situationId)`
— it could only answer questions about situations that exist in `/content`. But a slider
produces a situation vector that exists *nowhere*, and never will.

`applicableFor(situation: Situation)` now takes the vector directly;
`applicableHeuristics(id)` is a thin wrapper over it. Small change, and it is the
difference between a reference library and an instrument.

---

### Decision 7 — Show what does *not* fire, and what it would take

**Context.** The obvious design shows the heuristics that apply. That is a lookup table.

**Decision.** Render a **dormant** section listing every heuristic that did not fire,
each annotated with the exact comparisons blocking it — `needs any of [cognitive_load ≥
high → medium]`.

**Why.** The failed comparisons *are* the instructions for switching it on, so the dormant
list turns the tool from a lookup into an explorer: it tells you which constraint to move
to reach a different design conclusion. This also required making the predicate evaluator
**stop short-circuiting** — `every`/`some` would abandon the trace at the first decisive
branch, leaving the explanation incomplete. Correct explanations were worth a handful of
redundant comparisons.

---

### A bug the smoke test caught — in the test, not the code

`check-playground.ts` round-trips through the bundle and asserts on arbitrary vectors, the
path the CLI demo never touches. Its first run failed on:

> *dropping cognitive load must switch Hick's Law off*

The code was right and the assertion was wrong. Hick's Law is an `any` predicate over
`{cognitive_load ≥ high, time_budget_sec < 120}`; at a 90-second budget the second clause
still carries it. Relaxing one clause of an `any` **should** leave it firing.

The test now asserts that explicitly — one clause false keeps it alive, both clauses false
switches it off. That is also why the dormant panel distinguishes "needs **any of**" from
"needs **all of**": with `any` semantics, showing an undifferentiated list of blockers
would actively mislead.

---

### Design decisions worth noting

- **Evidence tags are visible in the UI, not buried.** `CONTESTED` sits next to Loss
  Aversion in amber, permanently. The differentiator is knowing where the evidence stops.
- **Firing conditions are shown inline, not on hover.** Each heuristic displays the
  comparison that fired and the actual value — `cognitive_load gte high → high`. The tool
  should never ask you to trust it.
- **The lens overlay defaults to a real company**, not "none". An empty panel teaches
  nothing, and this is where all four content dimensions finally meet on one screen.
- **Archetypes gained an explicit `order` field.** Presentation order was following
  filesystem read order, which is not a decision anyone made.

---

### What Milestone 2 deliberately did not do

No persistence, no accounts, no AI. The playground is stateless by design — it is an
instrument for exploring the graph, not a place to save work. Practice sessions arrive with
the database in a later milestone.

**Next:** the corpus is now the constraint, not the machinery. Three frameworks and eight
heuristics is enough to prove the model and too thin to prep with.

---

## Milestone 3 — The Learning Layer

**Trigger:** user feedback, in the bluntest and most useful form — *"it is currently quite
hard to understand what is going on."*

That was correct, and the diagnosis went deeper than "it needs documentation".

---

### The product insight

**The playground was an expert instrument shown to a novice.** It answers *"which rules
apply to this user right now?"* — a question that only makes sense to someone who already
knows the rules. It assumed you knew what CIRCLES was, what Hick's Law claimed, and why
`cognitive_load ≥ high` should matter to you. A newcomer saw a wall of green chips and
learned nothing.

The correction was not to simplify the playground. It was to build the layer underneath
it, and to **re-order the information architecture** so the learning layer is the front
door: the library is now `/`, and the playground is what you graduate into. Every heuristic
in the playground links to its concept page; every concept page links back to the
playground to see itself evaluated live.

The general lesson worth keeping: *an instrument is not a product until something teaches
you to hold it.*

---

### Decision 8 — The teaching block, and why it is shaped this way

Every concept now carries a `teaching` block. The field choices are the argument:

| Field | Why it exists |
|---|---|
| `mechanism` | Comes **before** any application. Knowing *why* something works is what lets you judge when it doesn't. Without this we are a flashcard deck with citations. |
| `in_interview.strong_sounds_like` / `weak_sounds_like` | Two fields, not one, because **the gap between them is the lesson**. They also become scoring exemplars for the interview engine later — authored once, used twice. |
| `in_product_work` | Moves the concept from exam material to working knowledge. |
| `in_daily_life` | Not filler — the **retrieval hook**. Nobody recalls "logarithmic choice reaction time" under interview pressure. They recall the diner menu. |
| `worked_example` | A concrete without/with pair. Abstraction plus one example beats abstraction alone. |

Made optional on the schema so the corpus can grow incrementally, with a validator warning
for concepts that lack it. Frameworks currently show "teaching content pending" in the
library rather than pretending to be complete.

---

### The content decision that matters most

The teaching content is written to **contradict the standard prep material** wherever the
standard material is wrong, and to say so explicitly:

- Miller's Law's `weak_sounds_like` is literally the sentence most candidates say — *"seven
  plus or minus two, so the navigation should have about seven items."*
- Hick's Law teaches the known-versus-unfamiliar boundary, because that is what separates
  understanding from recall.
- Loss Aversion's strong example **cites the dispute out loud** and proposes a test. In
  2026, asserting it as settled science reads as out of date rather than sophisticated.

This is the actual differentiator. Anyone can list twenty cognitive biases. Knowing which
three are misquoted, and what to say instead, is the thing that survives contact with a
real interviewer.

---

### Two small bugs worth recording

**The stale bundle.** The library rendered `claim` instead of `in_one_line` for every
concept. The content was fine and the code was fine — `src/generated/graph.json` simply
had not been recompiled since the teaching blocks were authored, and the JSX fell through
to its `?? h.claim` fallback. A silent-degradation bug: the graceful fallback hid the
staleness instead of surfacing it. Worth remembering when the compile step moves to CI.

**Doubled quotation marks.** The `sounds_like` content carried its own quote characters and
the component added typographic ones, rendering `""like this""`. Fixed by stripping them
from content — presentation belongs in the component, not in the data.

---

### What Milestone 3 deliberately did not do

Framework teaching content. Frameworks need a different block shape — `when_not_to_use`,
per-stage failure modes, and a full worked walkthrough of one real interview question —
and inventing that shape while authoring eight heuristics would have produced a compromise
that fit neither.

**Next:** framework teaching content, which needs its own block shape, and a corpus wide
enough to prep against.

---

## Milestone 4 — Covering the Canon

**Trigger:** the app was missing most of what a PM candidate actually needs. Benchmarked
against *Cracking the PM Interview* (McDowell & Bavaro, 2014), the standard text.

**Gap analysis before writing anything:**

| The book covers | pm-os had |
|---|---|
| Question taxonomy — behavioral, estimation, design, improvement, favorite product, strategy, metrics, technical | nothing |
| Business frameworks — SWOT, 5 Cs, Porter's Five Forces, 4 Ps, AIDA | none |
| Estimation toolkit — 8-step approach, numbers cheat sheet, Rule of 72 | none |
| Answer delivery — Nugget First, Speak in Bullets, S.A.R. | STAR only |
| Company variation across Google, Microsoft, Apple, Facebook, Amazon | 2 of 5 |

---

### Decision 9 — QuestionType is the new entry point

**The structural insight.** The app had no concept of *the thing a candidate actually
faces*. Everything was organised around the analyst's ontology — frameworks, heuristics,
archetypes — when nobody walks into an interview thinking "I need a procedural framework".
They think **"I've been asked to design a product."**

`QuestionType` became a first-class node with prompt forms, what is actually being scored,
a numbered approach, time guidance, pitfalls, and practice questions. Two new edge
relations connect it outward:

```
ANSWERED_WITH  question_type → framework      (which structures fit, ranked by fit)
ASKED_BY       question_type → company_lens   (who weights this most)
```

The library reorganised around it. Question types lead; frameworks, heuristics, and lenses
follow. This is the third time the information architecture has been reordered by asking
*what does the user actually have in their head when they arrive?* — and the third time
the answer was not what the data model suggested.

---

### Decision 10 — Framework teaching needed a different shape from heuristic teaching

A heuristic is a **claim** you either believe or not, so its teaching turns on mechanism
and evidence. A framework is a **structure** you either reach for or not, so its teaching
turns on fit. Reusing the heuristic `Teaching` block would have produced a bad fit for both.

`FrameworkTeaching` therefore carries `why_this_structure`, `when_to_use`,
**`when_not_to_use`**, a beat-by-beat `worked_walkthrough` keyed to real part ids, and
`failure_modes`.

`when_not_to_use` is the field that matters most, and it is the one prep material almost
never includes. Knowing that CIRCLES has no place to put your own actions — so it is the
wrong tool for a behavioural question — is worth more than another list of the seven stages.

---

### Decision 11 — Splitting the client bundle

Adding teaching content took the compiled bundle from 37 kB to **150 kB**, and the
playground was shipping all of it to every visitor. The playground renders names and
evaluates predicates; it never displays a teaching block and has no concept of a question
type.

`toClientBundle()` strips teaching prose and question types: **150 kB server, 65 kB
browser.** Milestone 2 predicted this exact pressure point — *"at 10× we either split by
archetype or move evaluation server-side behind the same interface"* — and because
everything already went through `GraphIndex`, the fix was one method and one import
change, with no logic forked.

---

### What was added

- **8 question types**, each with approach, pitfalls, worked example, and practice questions
- **4 new frameworks**: SWOT, Five Cs, Porter's Five Forces, and RICE — RICE finally
  exercising the `calculative` branch of the discriminated union, unused since Milestone 1
- **Teaching blocks** for CIRCLES, STAR, and AARRR, deferred from Milestone 3
- **3 company lenses**: Google, Apple, Microsoft — with 21 researched stage-weight edges
- **2 new page types**: `/question/[id]` and `/framework/[id]`
- Shared `app/teaching.tsx` so three page types cannot drift into three visual languages

Corpus: 8 question types · 7 frameworks · 34 framework parts · 8 heuristics · 5 company
lenses · 71 edges.

---

### On the source

The content is original throughout and deliberately **complementary rather than
duplicative**. Where the book lists frameworks, this adds when *not* to use each one. Where
the book reports heuristics, this checks them against primary sources and flags the three
that are commonly misstated. The book is the better linear read; this is the better
reference to traverse.

---

### What is still missing

The PM role itself — lifecycle phases, PM versus TPM versus program manager, the myths
chapter — has no home in the data model yet, because it is career content rather than
interview content and probably wants its own node type. Also absent: the 4 Ps and
AIDA/REAN, resume and cover letter guidance, negotiation, and the numbers cheat sheet as
a usable reference rather than prose.

**Next:** either the career layer, or the interview engine — which can now score against a
real question taxonomy rather than a single framework.

---

## Milestone 5 — The Taught Curriculum

**Goal:** cover what a product-management degree spends terms on — the subject knowledge
an interviewer assumes you already have and will not teach you in the room.

---

### Decision 12 — `Concept` is a fourth kind of node, and it needed to be

The existing node types each answer a different question, and none of them fit
*segmentation* or *unit economics*:

| Node | Answers |
|---|---|
| `question_type` | What situation am I in? |
| `framework` | What structure do I reach for? |
| `heuristic` | What claim can I apply? |
| **`concept`** | **What subject am I expected to already know?** |

Forcing unit economics into `framework` would have been wrong — it is not a structure you
walk through, it is a body of knowledge with formulas, failure modes, and an evidence
status. New relation `REQUIRES` connects question types to the concepts they assume.

---

### Decision 13 — Three explicit depths, not one compromise depth

The brief asked for *"high level concepts to very detailed contexts"*, and that is a real
schema decision rather than a writing-style note. The same subject has to serve someone
meeting it for the first time and someone being pushed on it by a staff PM two follow-ups
deep. Written at one depth it serves neither.

Every concept is therefore authored at three levels:

- **orientation** — what it is and why anyone cares
- **working** — the mechanics, the formulas, how to actually use it
- **expert** — where it breaks, what the live arguments are, what a follow-up will probe

Rendered as a single top-to-bottom progression with a colour ramp, so the page gets harder
as you read rather than hiding depth behind an accordion nobody opens.

---

### Decision 14 — `evidence` is a required field, and the research changed the content

Fact-checking was not a polish pass; it produced findings that materially altered what the
pages say. Four claims taught with far more confidence than they have earned:

| Claim as usually taught | What checking it found |
|---|---|
| **LTV:CAC should be 3:1** | Traces to David Skok's 2010 SaaS guideline, derived from mature public SaaS at steady state — his own phrasing was "our guideline", not a derivation. It carried conditions that get dropped, and observed healthy ratios range ~1.5:1 (DTC) to 4.2:1 (vertical SaaS) by margin structure. |
| **NPS is the one number you need to grow** | Keiningham et al. replicated Reichheld's analysis with a larger sample and found NPS performs **no better** than ordinary satisfaction measures at predicting growth. Academic assessment of construct and predictive validity has stayed critical through 2024. |
| **40% "very disappointed" = product-market fit** | Sean Ellis pattern-matched this across ~100 startups; the signal is real but **asymmetric**. Below 40 is informative; above 40 is not conclusive, because the survey over-samples engaged respondents and under-samples the lapsed users whose departure defines the absence of fit. |
| **Run an A/B test until it's significant** | Optional stopping is a multiple-comparisons problem. Frequent peeking can inflate the false-positive rate from 5% to 40%+. Fixed-horizon p-values assume exactly one look. |

`evidence: { strength, note }` is required on every concept precisely so this cannot be
quietly skipped as the corpus grows. The pages now teach the caveat alongside the claim,
and in several cases the `weak_sounds_like` example is the confident version most
candidates would say.

**This is the product thesis in its clearest form.** Anyone can list LTV:CAC. Knowing that
3:1 came from one investor's blog post about mature SaaS companies — and being able to say
so without sounding contrarian — is the thing that survives contact with a good
interviewer.

---

### What was added

12 concepts across 6 domains, each with three depth layers, formulas where they exist, a
worked numerical example, common errors, interview phrasing, and an evidence verdict:

- **customer** — Segmentation/Targeting/Positioning, Jobs to Be Done, Kano Model
- **strategy** — Product-Market Fit, Network Effects & Moats
- **economics** — Unit Economics, Pricing & Willingness to Pay
- **experimentation** — A/B Testing & Experiment Design
- **metrics** — Cohort Analysis & Retention Curves, North Star & Metric Trees, Survey Metrics & NPS
- **analytical** — MECE & Issue Trees

Plus 18 `REQUIRES` edges, a `/concept/[id]` page type, an "Assumed knowledge" section on
every question page, and a domain-grouped concepts section in the library.

Corpus: 8 question types · 12 concepts · 7 frameworks · 8 heuristics · 5 lenses · **89 edges**.

---

### The bundle split earned its keep

Concepts took the server bundle from 150 kB to 234 kB. The client bundle went from 65 kB to
**70 kB**, because `toClientBundle()` already strips exactly this kind of content. A
56% content increase cost the browser 8%. That is the Milestone 2 architecture paying off
for the second time without modification.

---

### What is still missing

Process concepts — discovery and dual-track agile, OKRs, design thinking — and the PM
career layer (lifecycle, PM vs TPM, the myths chapter). Also 4 Ps and AIDA, and the
numbers cheat sheet as a usable reference rather than prose.

**Next:** the interview engine now has what it needs — a question taxonomy, per-stage time
budgets, company rubric weights, and strong-versus-weak exemplars on every concept, which
are exactly the scoring anchors it would need.

---

## Milestone 6 — Killing the Playground, Keeping the Idea

**Trigger:** *"I am not sure if the playground would be useful — it is quite hard to
understand how we should be navigating this."*

---

### The honest diagnosis

The playground answered *"which heuristics fire for this user in this situation?"* Nobody
preparing for an interview has that question. They have *"how do I answer a product design
question at Meta?"*

Three specific failures:

- **It answered a question nobody asks.** An ontology explorer, not a prep tool.
- **It was a terminal node.** Everything else led somewhere — question type → framework →
  concept. The playground led nowhere.
- **Its content layer was the thinnest in the app.** 2 archetypes and 3 situations, against
  12 concepts and 8 question types. Built to prove the schema, never revisited.

It was simultaneously the most technically impressive and least useful thing here, and that
gap had widened every milestone. That is a recognisable failure mode: **the demo that
proves the architecture gets mistaken for the product.**

---

### Decision 15 — Repurpose rather than delete

The graph traversal was good; the job it was doing was not. Rather than deleting the
machinery, point it at a real task: a **timed practice session**.

Pick a question type, a company, and a user context, and get a real prompt, a stage
scaffold with per-stage time targets, the heuristics live for that user, the tensions to
resolve, and a self-check rubric.

**`expected_duration_pct` finally does something.** That field justified the framework
discriminated union back in Milestone 1 — "only procedural frameworks have time budgets,
and flattening them would kill the pacing feature" — and then sat unused for five
milestones. It now drives a live timer that highlights which stage you should be in.

**And the time allocation carries the project's oldest insight.** Time is allocated by the
*company's rubric weight*, not the framework's default. CIRCLES allots 15% of an answer to
Identify; Meta weights it 30%. Practising to the framework default systematically
underspends the stage carrying the most points — which is exactly what the Milestone 1
CLI demo discovered and nothing had acted on since. The scaffold shows the divergence
per stage with ▲▼ markers.

**The self-check rubric is authored zero times.** It is assembled from content that already
exists: question-type pitfalls (the `instead` clause) and company rubric `strong_signal`
fields. This is the Milestone 1 bet paying off — *rationale on the edges becomes UI copy
elsewhere.*

---

### Decision 16 — The client gets a view model, not the graph

The old playground received a trimmed copy of the whole graph and traversed it on every
keystroke. The practice builder receives `PracticeData` — a purpose-built payload assembled
server-side in `src/practice/model.ts`, shaped like what the UI renders.

This replaced the `toClientBundle()` split entirely. Better on three counts: smaller, no
general-purpose traversal in a hot path, and the client can no longer accidentally depend
on graph internals.

---

### A content bug the screenshot caught

First working version generated: *"Design an alarm clock for the blind — for a time-poor
new parent, one-handed reorder, 2am."* Incoherent, because `sample_questions` mostly name
their own user already, and binding a second one contradicts the first.

Fixed with a new `context_prompts` field: prompts deliberately silent about who the user
is, written specifically to have an archetype and situation bound to them. The scenario
builder draws from `context_prompts` when a user context is active and falls back to
`sample_questions` otherwise. Now: *"Design a grocery shopping experience — for a time-poor
new parent, one-handed reorder, 2am."*

Worth recording because it is a category of bug that only appears when data is composed at
runtime rather than authored whole — nothing was individually wrong, the combination was.

---

### Also in this milestone

- **4 new archetypes** (solo business owner, enterprise IT admin, early-career graduate,
  cautious later-life user) and **6 new situations** — the archetype layer stops being
  something you browse and becomes the raw material that makes a prompt concrete.
- A stale-cache incident worth noting: after deleting `app/playground/` and the client
  bundle, Turbopack served a cached module and `graph.concepts` resolved as undefined,
  producing a 500 on a page that typechecked clean. Clearing `.next` and restarting fixed
  it. Deleting files mid-session is the trigger.

Corpus: 8 question types · 12 concepts · 7 frameworks · 8 heuristics · 6 archetypes ·
9 situations · 5 lenses · 89 edges.

**Next:** the practice session is the natural host for the AI feedback engine — it already
has the prompt, the scaffold, the timing, and the rubric. What it lacks is a transcript.

---

## Milestone 6 — Process & Technical Concepts

**Goal:** close the two widest gaps in the curriculum — how the work gets decided
and shipped, and the technical depth an engineer expects a PM to hold.

**Shipped:** 7 concepts across two new domains, 12 new `REQUIRES` edges. The
`technical` question type went from almost no assumed-knowledge support to four
concepts.

- **process** — OKRs & Goal Setting, Product Discovery & Dual-Track, Prioritisation Frameworks
- **technical** — APIs & Integration, System Design Basics, Machine Learning for PMs, Data Models & Storage

Corpus: 8 question types · **19 concepts** · 7 frameworks · 8 heuristics · 5 lenses · **101 edges**.

---

### Fact-checking changed the content again

Two findings that altered what the pages say rather than merely decorating them.

**OKRs are a split verdict, and the halves point in opposite directions.** The
underlying psychology — Locke & Latham's goal-setting theory — is among the most
replicated frameworks in organisational psychology, built over a 35-year research
programme. OKRs as a *practice* have no controlled evidence at all. More
interesting: **OKRs contradict parts of the theory used to justify them.**
Goal-setting theory requires commitment and timely feedback; the 70% attainment
norm explicitly tells people not to expect to hit the target, and a quarterly
cadence is slow against most product loops. That tension is now the `expert` layer.

**The famous latency numbers are 2006 hearsay.** "Amazon found 100ms cost 1% of
sales" and "Google found 500ms cost 20% of traffic" are quoted everywhere as
settled. Both trace to unpublished internal experiments from 2006 — Greg Linden at
Amazon, Google's search-latency test — never published, never independently
replicated, and now twenty years old against different users with different
alternatives. The direction is almost certainly right; the coefficients are not
transferable. `system-design-for-pms` says so, and "quoting the Amazon 100ms
figure as established fact" is listed as a common error.

That is now **six** widely-taught claims this project labels contested with
citations, alongside LTV:CAC 3:1, NPS, the 40% PMF test, and loss aversion.

---

### What is still missing

The career layer — PM vs TPM vs PMM, levels and ladders, resume and referral
strategy. Design thinking and Agile delivery mechanics. And company lenses are
still labelled "researched estimates"; upgrading them to officially-sourced
citations from published candidate-prep pages would strengthen the content most
likely to be challenged.

**Known bug:** the site does not work on mobile. `/practice` overflows
horizontally at 390px — question-type chips, company names, and heuristic traces
are all cut off. Desktop-only until fixed.

---

## Milestone 7 — Company Lenses, Sourced

**Goal:** replace "researched estimates" with actual provenance. Of everything in
the repo, the company lenses were the content most likely to be challenged by
someone who has actually interviewed at those companies — and the blanket estimate
label, while honest, was useless.

**Shipped:** all 5 lenses rewritten against researched sources, a `/company/[id]`
page, and a provenance system that grades every claim.

---

### Decision 15 — Provenance is per-source, not per-page

The old label was a single sentence at the bottom of the UI saying the weights
were estimates. That made two very different kinds of claim look identical:
Amazon's Leadership Principles, quoted verbatim from amazon.jobs, and our own
guess at how heavily a CIRCLES stage is weighted.

Every source now carries a `tier`:

| Tier | Meaning |
|---|---|
| `official` | The company says this itself, in public, in writing |
| `corroborated` | Consistently reported across independent accounts; not first-party |
| `estimate` | Our inference. Explicitly not fact |

Rendered as a coloured tag next to each source, with a legend. The stage
weightings are still estimates — they are now *labelled* as estimates sitting next
to claims that are not, which is the honest presentation.

---

### The find: Meta publishes its own PM interview guide

Meta distributes a first-party PM interview prep guide to candidates. It did not
parse through normal fetching, so I extracted the text directly from the PDF. It
is by far the best source available for any of the five companies, and it
**contradicts widely repeated prep advice on four points**:

| Common advice | What Meta's own guide says |
|---|---|
| "Pick the narrowest possible segment or you'll be marked down" | Specific or broad **depends on the product and question** — what is scored is whether you can articulate the reasoning |
| "Know every Meta product cold" | They **do not** expect it. Ask the interviewer for context on unfamiliar products, and verify your understanding with them |
| "The process matters more than the answer" | **Both matter, neither is sufficient alone.** A thought process that ends nowhere is not a pass |
| "Ask as many clarifying questions as possible" | Balance clarification against **making reasonable decisions yourself** — 45 minutes is not much |

The guide also supplies the exact focus areas per round, the official pitfalls,
and Meta's own answer on metrics (prioritise one to three, and articulate why).

A new `myths` field carries these, and they render at the **top** of each company
page — above the loop, above the rubric. Correcting bad advice with a first-party
source is the single most valuable thing this project can do, so it goes first.

---

### What each lens gained

`values` (their vocabulary, not ours), `loop` (stage, format, duration, what it
tests), `sample_questions`, `myths`, and a required `sources` array.

- **Amazon** — all 16 Leadership Principles with exact names, verified against
  amazon.jobs. Bar Raiser mechanics: outside the hiring team, does not report to
  the hiring manager, holds veto, trained to push past prepared answers.
- **Meta** — the official guide above.
- **Google** — the four published attributes (GCA, role-related knowledge,
  leadership, Googleyness). The structural insight: **the interviewer does not
  decide.** A hiring committee that never met you decides from written notes, so
  clarity beats rapport — if your interviewer cannot write down why your answer
  was good, the committee never sees it.
- **Microsoft** — growth mindset as the explicit cultural centre (Nadella's
  learn-it-all framing, drawing on Dweck), plus the As-Appropriate round, which
  functions much like a Bar Raiser.
- **Apple** — the functional-organisation structure, sourced to Podolny & Hansen's
  HBR piece written by Apple University's then-dean. Design belongs to a separate
  organisation, so a PM positioning themselves as the design authority is
  misreading the role.

---

### Still open

The mobile bug remains. `/practice` overflows horizontally at 390px.

---

## Milestone 8 — The Graph, Made Navigable

**Goal:** Obsidian-style interlinking, PM-focused.

### The measurement that reframed it

Before building, I counted. 68 linkable entities, but only **35** exact-name
cross-references in prose — against **50 jargon terms used 540 times** that were
not entities at all. "Segment" 95 times, "cohort" 40, "guardrail" 22, defined
nowhere.

So the problem was not that pages failed to link. It was that **there was almost
nothing to link to.** The corpus read fluently to someone who already had the
vocabulary and was opaque to everyone else — exactly the failure the learning
layer was meant to fix.

### Decision 16 — `Term` is a fourth kind of node, deliberately lighter than `Concept`

A concept is a subject you study: three depth layers, formulas, evidence verdict,
worked example. A term is a word you need to parse a sentence. Conflating them
would either bloat the glossary into 50 more study pages or dilute what a concept
means. **46 terms** authored, each with a definition, optional formula, a
`watch_out`, and see-also links.

### Decision 17 — Auto-link on first mention, rather than hand-authoring wiki-links

Retrofitting `[[wiki-links]]` across 540 mentions was the alternative. Instead the
linker matches names and aliases at render time and links the **first mention per
page only**, so prose does not turn blue. Longest-match-first ordering means
"loss aversion" wins over "loss". A deny-list covers surface forms that are also
ordinary English here — "recall", "precision", "structure" — where a confident
wrong link is worse than none.

Pure matching lives in `src/graph/linker.ts` and returns segments; React rendering
lives in `app/linked.tsx`. That split keeps the matching testable in plain Node.

### Why the backlinks beat a wiki's

Obsidian can only say *"these two notes mention each other."* Our edges carry a
relation type **and an authored rationale**, so an inbound link says what the
relationship is and what to do about it — *"TENSIONS_WITH: resolve toward Hick's
when the user is under load."* Written once on the edge, read on the concept page,
in backlinks, and in the practice builder.

Two kinds of inbound link render separately and on purpose: **authored edges**
(curated, typed, reasoned) and **prose mentions** (discovered at build time, no
claim beyond co-occurrence).

### Shipped

- **46 terms**, `/glossary` index, `/term/[id]` pages
- **Auto-linking with CSS-only hover previews** — no per-link JS, no hydration cost
- **Typed backlinks** on every concept, heuristic, framework, question, company, and term page
- **⌘K search palette** — subsequence matching, keyboard-driven, 93 entries
- **`/graph`** — force-directed map, ~130 lines of hand-written simulation rather
  than a dependency. Deterministic seeding, so the same corpus always draws the
  same picture, which matters when a screenshot goes in a case study.

Three derived indexes are now emitted at build time — `search.json` (18.7 kB),
`mentions.json` (8 kB), `graphview.json` (34.4 kB) — all pure functions of the
content, so none of it is computed per request.

**Graph totals: 93 nodes, 351 edges** (101 authored + 250 discovered mentions).

**Still open:** the mobile overflow bug at 390px.

---

## Milestone 9 — The Other Side of the Table

**Goal:** the practice page was confusing and only marginally useful. Replace it
with the thing nobody else publishes.

**Shipped:** `/interviewer` — 8 guides, one per question type, written to be used
live by someone running a mock interview. **48 probes, 99 observable signals,
34 bias guards.** The 715-line practice builder is deleted.

---

### Decision 18 — Interviewer-first, candidates welcome

Every prep site publishes questions and model answers. Almost none publish the
interviewer's side, because real calibration guides are internal and confidential.
That absence is the whole opportunity.

The second-order benefit is what makes this one product rather than two: **reading
the rubric is better candidate preparation than practising blind.** Knowing that
Meta scores *"articulated the reasoning for the segment choice"* rather than
*"picked a narrow segment"* changes what you practise. One voice, one artefact,
two audiences.

Each guide carries: what the question is *for*, a delivery script, prepared
answers to likely clarifying questions (**what to grant, what to hand back**),
time checkpoints, a probe ladder, rescue lines with an explicit *hold-back*, the
signal checklist, anti-signals, and bias guards.

---

### Decision 19 — Signal checklist, not levels with anchors

I proposed a 4-level scale with behavioural anchors. **The better call was the
checklist**, and for the reason this project keeps returning to: we have no basis
for a calibration scale. Inventing what a "3" versus a "4" sounds like would imply
a precision we cannot support.

Observable behaviours — *"named a guardrail metric"*, *"matched timing to a
rollout curve rather than a release date"* — are things two interviewers would
agree either happened or did not. That is honest, and it is more usable live.

---

### Decision 20 — Provenance in the banner, not the footer

These guides are **constructed** from published criteria. A repo whose entire
argument is honesty about sourcing cannot then present invented interviewer
material as though it were leaked. Every guide has a required `basis` field
explaining how it was assembled, rendered in an amber `constructed` banner above
the fold, and the validator rejects a guide whose basis is under 40 characters.

---

### Bias guards are a first-class field, minimum two

Real interviewer training spends significant time on what *not* to score, and no
public prep material covers it at all. Each guide names its own: don't score
fluency or accent; don't reward familiarity with your own product; don't let a
strong opening halo the later dimensions; probe strong and weak candidates equally
hard, because probing only the ones you doubt manufactures the evidence that
confirms your first impression.

That last one is, I think, the single most useful sentence in the whole feature.

---

### What was deleted

`app/practice/` and `src/practice/model.ts` — 715 lines. The timer and stage-pacing
scaffold went with it; `expected_duration_pct` now feeds the `checkpoints` field
instead, which serves the same purpose for a real session rather than a solo drill.

**Still open:** the mobile overflow bug. The guide pages use a two-column layout
that collapses correctly, but the earlier pages have not been checked at 390px.

---

## Milestone 10 — Auditing the Guides Against a Spec

**Goal:** verify the interviewer guides actually cover the PM competencies and
session mechanics they claim to, rather than assuming they do.

### The audit found two universal gaps

I wrote a script to check all eight guides against five core competencies and five
structural elements, instead of reasoning from memory. Two columns came back **0/8**:

| Gap | Before |
|---|---|
| **Session arc** — intro, core, candidate Q&A | 0/8 |
| **Debrief / Plus-Delta** | 0/8 |
| Stress-test push-back | 5/8 |
| Collaboration as a scored signal | 4/8 |

The debrief absence was the worst of them. A mock interview whose value ends at
scoring has wasted most of its point — the feedback *is* the deliverable, and
nothing in the product produced any.

### Decision 21 — Shared mechanics live once, not nine times

The session arc, what you are grading, how to act as a collaborative partner, and
the Plus/Delta format are the same whichever question you run. They now live at
`/interviewer/running-a-session` rather than being repeated in every guide. What
*is* question-specific — pre-written Plus and Delta lines, and the single most
common thing to tell someone after that question — sits on each guide.

Plus/Delta rather than strengths/weaknesses on purpose: **delta names a change,
weakness names a deficiency.** "Name the criterion before you rank" is actionable;
"weak on prioritisation" is a label they can do nothing with.

### Decision 22 — Record what a question does NOT test

The obvious move was to force all five competencies into all nine guides. That
would have been padding: an estimation question genuinely does not exercise user
segmentation, and pretending otherwise misleads someone planning a practice loop.

Each guide now declares `core`, `light`, and `not_tested` competencies, rendered as
chips with the untested ones struck through — *"this question will not show you
segmentation, run a second one that does."* **The absences are the useful part**,
because they tell you which question to pair it with.

### Added

- **A ninth guide** — the remote-coworker connection prompt, which exercises all
  five competencies in one pass and is unusually good at catching design-for-yourself,
  since nearly every candidate is themselves a remote worker with strong opinions.
- Stress-test probes for estimation, metrics diagnosis, and product improvement.
- "Working with you" signal groups covering whether the candidate treats you as a
  partner or monologues at you.
- Guidance on **inventing constraints when asked** — and writing down whatever you
  invent so it stays identical for the next candidate.

**Now: 9 guides · 58 probes · 129 signals · all 9 structural elements covered in all 9 guides.**

---

## Milestone 11 — Mobile, and a Mark

### A correction: I reported a bug I could not actually see

For several milestones I logged "the site does not work on mobile — `/practice`
overflows at 390px", based on headless screenshots at `--window-size=390`.

**Chrome headless clamps the viewport to a 500px minimum.** Those screenshots were
a 500px layout cropped to a 390px image, so content that simply extended past the
crop looked like overflow. Measuring from inside the page — `scrollWidth` against
`clientWidth` — returned `SW=500 VW=500`, i.e. clean, on every page I had called
broken.

I tried two ways around the clamp (new headless mode, then a same-origin iframe
harness) and neither produced a true narrow viewport. So the honest position is:
**I could not reproduce the bug I had been reporting, and I should have verified it
before logging it three times.**

### There was still a real defect, found by reading rather than screenshotting

The nav held four links plus the search button in a single non-wrapping flex row —
roughly 450px of intrinsic width. Because `<Nav>` sits above every page, any
viewport under ~450px would have inherited that overflow site-wide, which is
exactly the symptom I had been describing. Structural, verifiable by reading the
CSS, and independent of whether I could screenshot it.

**Fixed:** the nav is now two rows on small screens — brand and search on the
first, links on the second in a horizontally-scrollable strip. The strip cannot
re-break the layout when a fifth destination is added later, which the old flex row
would have.

Also fixed along the way:

- Page gutters are now `px-4` on mobile, `px-6` from `sm` up.
- Long URLs and identifiers get `overflow-wrap`, the one overflow source a
  `max-width` genuinely cannot contain.
- `Segmented`, `Panel`, and `Chip` deleted — dead since the playground was removed,
  and `Segmented` carried a fixed `grid-cols-[7.5rem_1fr]` that would itself have
  overflowed a narrow viewport.

### Two unrelated bugs surfaced while in there

**The root metadata title still advertised the deleted playground** — every page
served `pm-os · Archetype & Heuristic Playground` in its tab and in link previews,
two milestones after that page was removed. Replaced with a proper
`default` + `template` pair.

Then I broke it myself: the de-duplication pass that stripped `· pm-os` from child
page titles also matched inside the template string `"%s · pm-os"`, silently
reducing it to `"%s"` and removing the suffix from every page. Caught by checking
the rendered titles rather than trusting the edit.

### The mark

Three nodes and two edges — the product is a knowledge graph, so the logo is one.
Deliberately two-tone and geometric so it survives being rendered at 16px in a
browser tab, with its own dark rounded-square background so it reads against a
light tab strip. `app/icon.svg` (Next generates the favicon link) plus a
`currentColor` React component for the nav.

---

## Milestone 12 — The Half of the Question the Candidate Never Sees

**The gap.** The guides told an interviewer how to deliver a prompt, what to probe
and what to score — but not what was *true*. Asked "what's the business goal?" or
"did anything ship recently?", the interviewer had a scattering of answers in the
clarifying list and otherwise had to improvise. Which means two people running the
same question improvise two different worlds, and a candidate's score ends up
partly determined by which world they happened to draw.

That is not a content gap, it is a measurement failure, and it has a name in the
literature. Correcting a long-standing range-restriction overcorrection in the
older meta-analyses, Sackett et al. (2022) put structured interviews at ρ = .42
against job performance and unstructured ones at .19 — same hour, same people, more
than double the signal, and the difference is almost entirely procedural. Two of
the fifteen structure components Campion, Palmer & Campion (1997) catalogued are
asking every candidate the same questions and *limiting improvised prompting*. A
guide that leaves the world to improvisation is failing the second one by
construction.

### Where the format came from

I went looking for how interviewers are actually trained to hold information back,
and the answer is that the discipline is solved — just not in product management.
Consulting casebooks have carried it for decades: in the Ross School of Business
casebook (2010), every single case ships a page headed **"Guidance for interviewer
and information provided upon request"** facing the problem statement, containing
lines like *"if asked anything about the other gas station, the answer is 'we don't
know, but assume they are identical'"* and *"don't let the candidate start asking
for numbers yet"* and *"candidate should recognize that each gas station serves 500
people."*

Facts with a release condition, and a planted insight with a trigger. That is
exactly the missing document, and it has never been written down for PM interviews.

Google's re:Work guide gets at the same thing from the other end — same questions,
standardised rubrics, **predetermined** follow-ups — and Amazon's Bar Raiser
programme is months of shadowing before certification. What none of them publish is
the per-question artefact, because that is the confidential part.

### What got built

A required `brief` on every `InterviewGuide`, with four parts:

- **`premise`** — the backdrop, held identically for every candidate.
- **`facts`** — each tagged with a `release`: `stated` (you volunteer it),
  `on_request` (grant it the moment they ask), `on_earned_ask` (only if they ask
  the specific question), `withheld` (you hold it).
- **`open`** — what the prompt deliberately does not settle, with what a defensible
  assumption sounds like and why you never resolve it.
- **`keys`** — the pivots the question turns on, each with the move that unlocks it
  and what to do when nobody finds it.

Across nine guides: 60 facts, 26 open questions, 27 pivots.

**The distinction that carries the feature** is `on_request` versus
`on_earned_ask`. Granting missing context costs nothing and saves the candidate's
clock; granting the fact they were supposed to go looking for deletes the exercise.
An interviewer who has not drawn that line in advance gives everything to whoever
asks most confidently — which scores assertiveness, not reasoning. The rule the
corpus now states in one line: **withhold what tests judgement, grant what is
merely missing context.**

### Two decisions worth recording

**`ground_truth` is optional, and only three guides have one.** The temptation was
to give every question a hidden answer, because it makes the panel feel more
substantial. But only diagnosis, estimation and the technical scoping question have
one. Product-sense prompts do not, and inventing one would be worse than leaving it
blank: it would license an interviewer to grade toward their own preferred solution
while believing they were grading against a key. So `estimation` carries the
opposite instruction — *there isn't one, and you should say so out loud rather than
implying you are withholding a key* — and product-design carries no field at all.

**The strategy guide's brief is mostly empty on purpose.** Every other guide grants
context freely. That one holds every market figure, warmly and identically, because
the candidate's discomfort *is* the measurement and one sympathetic invented
statistic ends it permanently. Worth noting explicitly so it does not read as an
unfinished brief.

Two related honesty guards ended up in the content rather than the code. Every
invented figure is labelled as invented in its own premise, so an interviewer never
passes one to a candidate as real research. And where a genuine insight would be
unfair to require — the strategy guide's regulatory pivot rests on Indian
foreign-investment rules — `if_missed` says outright: *do not penalise not knowing
this; ask the general version instead.* Domain trivia scored as insight selects for
people who already worked in the region, which is the bias the guides exist to
guard against.

### The integrity checks are the interesting part

Zod can enforce the shape. It cannot enforce that the brief is *useful*, so
`check-guides` now asserts:

- Something is held back — a brief where every fact is freely given is a summary of
  the prompt with extra steps.
- Something is granted — an interviewer who can only refuse is not running a case.
- Every `withheld` or `on_earned_ask` fact states *why*. "Withhold this" with no
  reason is the kind of instruction people quietly override at minute twenty.
- Every pivot has a real `if_missed`, not a stub. The fallback is what makes a
  pivot usable by someone who did not write it.

### UI

The brief sits above the signal checklist in the right rail, which is what the rail
is for — one is read before the session, the other ticked during it. The aside owns
scrolling now as a single sticky column; the checklist's own `max-h-[70vh]` came
out, because nesting a scroll region inside a sticky one traps the wheel.

Release badges sit above each fact rather than beside it: inline, the longest label
("only if asked precisely") ate half of a 380px rail and squeezed the fact into a
four-word column. `ground_truth` is the one collapsed element — a `<details>`, so
it needs no JavaScript, and it is the only thing on the page you must not read by
accident.

### Verified

Build clean, typecheck clean, all nine briefs pass the new integrity checks, routes
200, spoiler renders only on the three guides that have a `ground_truth`, and
auto-linking works inside the panel.

### Addendum — cutting it back

First review of the panel, and it was right: too many words for something you read
while a candidate is waiting. Two specific problems, both mine.

**"If they ask" and "What you know" were the same content twice on one page.** The
main column listed *"Is this across all platforms?" → "iOS and web flat, Android
down 34%"*, and the rail listed the same fact with a release tag. I had added a
better version of an existing section instead of replacing it.

Fixed by merging: `clarifying` is gone from the schema, and `BriefFact` and
`OpenQuestion` gained an optional `asks` — the phrasing the question usually
arrives in. Each entry is now *one* place: the question, what you say, and how hard
they have to work for it. 47 of 63 facts carry an `asks`. Which side of the line
something falls on decides where it lives — hand over a fact and it is a fact, hand
it back and it is an open question. The main column lost a whole section.

**The premises argued instead of orienting.** *"Every figure below is invented for
the exercise: say them with confidence, write them down, and hold them identically
across candidates, because the moment two candidates get different worlds their
scores stop being comparable"* — that is the case for briefs existing, restated in
all nine of them, in the place where someone is looking for the business goal. The
argument is already made once on the running-a-session page, and the guide's
`constructed` banner already says the figures are not real. Premises are now two or
three sentences of backdrop and nothing else.

Same cut applied to the `why` on every fact. Justifying all sixty was the same
mistake at a smaller scale, so `why` is now allowed *only* on facts you hold back —
where "don't give them this" genuinely needs a reason or it gets overridden at
minute twenty. Freely-granted facts carry none. Both directions are asserted in
`check-guides`, along with an upper bound on premise length, because the first draft
of every one of these drifted into rationale and the next one will too.
