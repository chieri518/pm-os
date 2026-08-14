# pm-os

A dynamic knowledge graph for PM interview preparation — bridging structural
frameworks, user archetypes, behavioural heuristics, and company-specific rubrics.

Unlike static prep libraries, `pm-os` treats these as **four facets of one answer**
rather than four separate content types. A strong response is a traversal:

```
Framework(CIRCLES) → Stage(Identify) → Archetype(new parent)
   → Situation(2am, one-handed, 90s) → Heuristic(Hick's Law)
   → Tension(vs Jakob's Law) → Lens(Meta: segmentation weighted 30%)
```

## Quick start

```bash
npm install
npm run dev        # the app at localhost:3000
npm run validate   # schema + referential integrity across all content
npm run check      # integrity checks on the interviewer guides
npm run demo       # answers the milestone-1 query in the terminal
```

## The one architectural idea

**Heuristics bind to *situations*, never to *archetypes*.**

Hick's Law does not apply to "a busy parent." It applies to anyone under high cognitive
load or a sub-two-minute time budget. A busy parent just occupies that state often — and
does not occupy it on a Saturday morning.

So personas split into two layers:

| Layer | Holds | Changes |
|---|---|---|
| `Archetype` | age band, life stage, role, drivers, values, frictions | slowly — it is who they are |
| `Situation` | device, hands free, time budget, cognitive load, motivation, ability, stakes | constantly — it is where they are |

Heuristics carry a **predicate** over situational dimensions. Run one archetype through
two situations and you get two different answers, which is the whole point.

## Repository layout

```
content/            canonical knowledge, validated YAML — the source of truth
  questions/        the interview question taxonomy — the entry point
  concepts/         the taught curriculum, written at three depths
  frameworks/       procedural, narrative, taxonomic, and calculative kinds
  heuristics/       one file each, with caveats and common misapplications
  terms/            the glossary — words you need to parse a sentence
  guides/           interviewer guides: situation briefs, probes, signals, bias guards
  situations/       the 7-dimension context vectors
  archetypes/       identity layer; points at typical situations
  lenses/           company loops, values, and where prep folklore is wrong
  edges/            typed relations — every one carries a rationale

src/
  schema/           Zod schemas; the contract for all content
  graph/            loader, in-memory queryable index, predicate evaluator, auto-linker
  scripts/          validate, build-graph, check, demo
```

## Data model

Nine node types and nine typed, directional edge relations:

```
ANSWERED_WITH  question_type → framework      (which structures fit this question)
REQUIRES       question_type → concept        (subject knowledge assumed, not taught)
ASKED_BY       question_type → company_lens   (who weights this question most)
APPLIES_TO     heuristic     → situation
SURFACES_AT    heuristic     → framework_part
TENSIONS_WITH  heuristic     ↔ heuristic      (symmetric; resolution guidance required)
SPECIALIZES    heuristic     → heuristic
WEIGHTS        company_lens  → framework_part (carries a numeric weight)
TYPICAL_FOR    situation     → archetype      (many-to-many)
```

Every edge requires a prose `rationale`. That string is the product — it becomes
explanation copy, interview feedback, and revision material. An edge without a reason is
just a tag.

## Concepts, at three depths

The taught curriculum — segmentation, unit economics, experiment design, cohort analysis —
lives in `concepts/`. Each is written at three explicit levels rather than one compromise
level: **orientation** (what it is and why anyone cares), **working** (mechanics, formulas,
how to use it), and **expert** (where it breaks, what the live arguments are, what a
follow-up will probe). The same subject has to serve a first encounter and a staff PM two
follow-ups deep; written at one depth it serves neither.

Every concept carries a required `evidence` verdict. That field exists because the research
kept changing what the pages should say.

## On accuracy

Several claims taught as settled are materially shakier than their confidence implies:

- **Miller's 7±2** was about immediate recall of *unrelated items*; the defensible figure
  is nearer four chunks (Cowan 2001), and a persistent on-screen menu imposes no memory load.
- **Loss aversion** is under active dispute (Gal & Rucker 2018); a 2025 re-meta-analysis
  found it not robust.
- **Hick's Law** is logarithmic only for known, anticipated options — serial scanning of
  unfamiliar options is linear (Landauer & Nachbar).
- **LTV:CAC 3:1** originates in a 2010 investor guideline for mature SaaS, not a finding.
  Healthy observed ratios range ~1.5:1 to 4.2:1 by margin structure.
- **NPS** performs no better than ordinary satisfaction measures at predicting growth
  (Keiningham et al. 2007; validity still contested in 2024).
- **The 40% PMF test** is asymmetric: below 40 is informative, above 40 is not conclusive.

`caveat`, `common_misapplication`, and a required `evidence_strength` enum are therefore
first-class schema fields. The validator warns on any non-replicated heuristic lacking a
caveat. Knowing where the evidence stops is the differentiated value here.

Company lens weights are researched estimates from published rubrics and public
interview guidance — not insider information.

## The library (`/`)

**Question types are the entry point.** Nobody walks into an interview thinking "I need a
procedural framework" — they think "I've been asked to design a product". Each question
type carries the approach, what is actually being scored, the pitfalls ranked by cost, and
links out to the frameworks that fit it and the companies that weight it most.

Every concept carries a **teaching block**: its mechanism, how to deploy it in an
interview with strong-versus-weak phrasing, how it shows up in real product work, a daily-life
retrieval hook, and a worked without/with example — plus its caveats and the misapplication
to avoid.

The `mechanism` field comes before any application on purpose: knowing *why* something
works is what lets you judge when it doesn't. Without it, this would be a flashcard deck
with citations.

## Interviewer guides (`/interviewer`)

The part nobody else publishes. Every prep site has questions and model answers; almost
none have the other side of the table — how to deliver the prompt, **which clarifications
to grant and which to hand back**, when to probe deeper, how to unstick a candidate
without giving it away, and what to refuse to score on.

Nine guides: **58 probes, 129 observable signals, 39 bias guards.** Scoring is a tickable
checklist of observable behaviours rather than a 1–4 scale with anchors — we have no basis
for a calibration scale, and inventing one would imply a precision we cannot support.

Each guide also carries a **situation brief**: the world the one-sentence prompt was cut
out of. **63 facts, each tagged with how hard it is to get** — say it, give it if asked,
give it only if they ask precisely, hold it — and 47 of them carry the phrasing the question
usually arrives in, so the brief doubles as the answer sheet for clarifying questions. Plus
**21 things left deliberately open** with what a defensible assumption looks like, and
**27 pivots** the question turns on, with the move that unlocks each and what to do when
nobody finds it. Three questions have a hidden right answer and carry it; the rest say
plainly that they do not, because inventing one would license grading toward a preferred
solution.

Only held-back facts carry a justification — a fact you are handing over needs no defence,
and this is enforced in `npm run check` rather than left to discipline. A panel you glance
at mid-session cannot also be an essay.

The format is borrowed from consulting casebooks, where every case ships a *guidance for
interviewer and information provided upon request* page facing the problem statement. The
reason to bother: correcting a range-restriction error in the older meta-analyses, Sackett
et al. (2022) put structured interviews at ρ = .42 against job performance and unstructured
ones at .19. Two people improvising two different worlds from the same prompt are running
an unstructured interview whether they mean to or not.

These are **constructed** from published criteria, not reproduced from anyone's internal
material. Each guide states how it was assembled, in a banner above the fold.

If you are the candidate, read them anyway. Studying the checklist tells you more about
what earns a score than practising blind ever will.

## Linking, glossary and graph

The corpus used to read fluently only to people who already had the vocabulary —
"segment" appeared 95 times, "cohort" 40, "guardrail" 22, all undefined. So there is now
a **46-term glossary** (`/glossary`), and prose is **auto-linked on first mention** with
hover previews, which retrofits hypertext onto content written before the glossary existed.

**Backlinks are typed.** A wiki can only say "these two notes mention each other". Because
every edge carries a relation and an authored rationale, an inbound link here says what
the relationship *is* — *"TENSIONS_WITH: resolve toward Hick's when the user is under
load"*. Authored edges and discovered prose mentions render separately, because only one
of them carries a claim.

`/graph` draws the whole corpus — 93 nodes, 351 edges — with a hand-written force
simulation rather than a dependency. ⌘K searches everything.

## Licence and sourcing

Source code is MIT. The content under `content/` is CC BY-NC 4.0. See
[LICENSE](LICENSE) and [NOTICE.md](NOTICE.md) — the latter covers originality,
the evidence policy, and the fact that company rubric weights are **researched
estimates, not insider information**.

> **Set your name in [LICENSE](LICENSE)** — it currently reads `<YOUR NAME>`.

## Relationship to *Cracking the PM Interview*

Built as a companion to McDowell & Bavaro's book, which remains the better linear read.
This covers the same ground as something you traverse rather than read: where the book
lists frameworks, this adds when *not* to use each one; where it reports heuristics, this
checks them against primary sources and flags the ones commonly misstated. All content is
original writing — no text is reproduced from the book, and the example questions here are
either industry-standard or written for this project.

## Status

Milestones 1–6 complete: data architecture, learning layer, canon coverage, the taught
curriculum, and the practice builder. Corpus: 8 question types, 12 concepts, 7 frameworks,
8 heuristics, 6 archetypes, 9 situations, 5 company lenses, 89 edges.
See [BUILD_LOG.md](BUILD_LOG.md) for decisions, trade-offs, and the bugs worth remembering.
