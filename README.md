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
npm run check      # smoke-tests the live query path against ad-hoc vectors
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
  situations/       the 7-dimension context vectors — practice scenario inputs
  archetypes/       identity layer; points at typical situations
  lenses/           company rubrics with weighted dimensions
  edges/            typed relations — every one carries a rationale

src/
  schema/           Zod schemas; the contract for all content
  graph/            predicate evaluator, loader, in-memory queryable index
  practice/         view model for the practice builder — what the client receives
  scripts/          validate + demo entry points
```

## Data model

Seven node types and eight typed, directional edge relations:

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

## The playground (`/playground`)

Seven live controls over the situational layer. Every change recomputes which heuristics
fire, the exact comparison that fired them, which pairs are now in tension, and where each
lands in a company rubric.

Predicates evaluate **in the browser** — the content compiles to a 65 kB client bundle
(teaching prose and question types stripped out) and the same `GraphIndex` class rehydrates
client-side, so a slider drag is instant and there is
only one implementation of every query. The dormant list shows what *didn't* fire and the
exact conditions that would switch it on, which turns a lookup table into an explorer.

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
