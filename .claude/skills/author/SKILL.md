---
name: author
description: Research and draft a new heuristic for the pm-os knowledge graph — the YAML node plus its edges — then validate, inspect, and self-correct until it passes. Use when asked to add, author, or draft a heuristic (e.g. "/author zeigarnik effect").
argument-hint: <heuristic name>
---

# Author a heuristic

You are adding **$ARGUMENTS** to the pm-os knowledge graph. The output is one new
file in `content/heuristics/` plus new edges in `content/edges/`, validated and
presented for human review. Nothing is committed.

Work through the steps in order. Do not skip the research step even if you think
you already know the heuristic — the caveat is the most valuable field and it is
the one most often wrong from memory.

## 1. Check it does not already exist

- Derive a kebab-case id (e.g. `zeigarnik-effect`).
- Search `content/heuristics/` for the id, the name, and likely aliases
  (`grep -ril`). If it exists, stop and say so.
- If it is really a **concept** (a body of knowledge, like cohort retention) or a
  **term** (vocabulary), not a heuristic, stop and say so — do not force it.

## 2. Learn the house style

Read these before writing anything:

- `content/heuristics/hicks-law.yaml` — the reference `experience` heuristic
- `content/heuristics/type-1-type-2-doors.yaml` — the reference `decision` heuristic
- `src/schema/nodes.ts` (`Teaching`, `HeuristicBase`, `Heuristic`) and
  `src/schema/primitives.ts` (`SituationDimension`, `EvidenceStrength`, `Predicate`)
- `content/edges/tensions.yaml` and `content/edges/heuristic-surfaces.yaml`

Match the voice: British spelling, concrete, opinionated, no marketing language,
`>-` folded scalars for prose.

## 3. Research

Use web search. Find, and record the URLs for your final report:

1. The **original source** — author, year, what was actually measured.
2. **Replication status** — later studies, meta-analyses, failed replications.
3. The **popular misreading** — what blog posts and prep guides claim it says.

Set `evidence_strength` from what you found, not from how famous it is:
`replicated` · `supported` · `heuristic` (craft knowledge, thin evidence) ·
`contested` (known replication problems). When unsure, choose the weaker value.

If you cannot find the original source, say so plainly in the report and do not
invent a citation. A missing `source` is acceptable; a fabricated one is not.

## 4. Decide the scope

- **`experience`** — it acts on a user *in a situation*. Needs `applies_when`, a
  predicate over the seven dimensions: `device`, `hands_free`, `time_budget_sec`,
  `cognitive_load`, `motivation`, `ability`, `stakes`.
- **`decision`** — it acts on the *PM's own reasoning*. No predicate; it reaches
  the graph only through `SURFACES_AT` edges.

**The predicate describes a state, never a person.** "Applies to new users" is
wrong; "applies when ability is low" is right. If the heuristic cannot be
expressed with the seven dimensions, say so in the report — do not add a
dimension yourself.

## 5. Write the node

Create `content/heuristics/<id>.yaml` with every field the reference file has:
`id`, `scope`, `name`, `aka`, `claim`, `implication`, `evidence_strength`,
`caveat`, `common_misapplication`, the full `teaching` block, `applies_when` (if
experience), and `source`.

- `caveat` — where the research stops. Required in spirit even though optional in
  the schema.
- `common_misapplication` — the confident wrong version a candidate says aloud.
- `strong_sounds_like` / `weak_sounds_like` — spoken interview lines. The gap
  between them is the lesson.
- `in_daily_life` — a memorable everyday image, not a restatement.

## 6. Write the edges

Every edge needs a `rationale` of at least one real sentence explaining *why*.
Only reference ids that exist — list them from `content/` first.

- **`SURFACES_AT`** (at least one) → append to `content/edges/heuristic-surfaces.yaml`.
  Target a framework part id such as `circles.list` or `star.action`.
- **`TENSIONS_WITH`** (at least one, if a genuine tension exists) → append to
  `content/edges/tensions.yaml`. The rationale **must say how to resolve it** —
  which to prefer, and when.
- **`SPECIALIZES`** only if it is a narrower case of an existing heuristic.

Do not invent a tension to fill a quota. If none is genuine, say so.

## 7. Validate and self-correct

Run `npm run validate`.

- If it fails, read each issue, fix the file, and run it again.
- If it passes with a ⚠ warning about the new heuristic, fix that too.
- Stop after **5** attempts. If it still fails, report the remaining errors
  verbatim instead of guessing further.

## 8. Inspect the meaning

Run `npm run inspect -- <id>`. This shows which situations the predicate fires
in. Validation proves the file is well-formed; this checks it makes sense.

Read the list and ask: would a thoughtful PM agree it applies in exactly these
situations? If it fires nowhere, everywhere, or somewhere absurd, revise the
predicate and repeat steps 7–8.

## 9. Report for human review

End with a short report — the human decides whether to keep it:

- **Files changed** — the new node and each edges file.
- **Evidence** — the `evidence_strength` you chose and why, with source URLs.
- **Fires in** — the situation list from `inspect`, and why it looks right.
- **Edges** — each one, in one line.
- **Attempts** — how many validation runs it took, and what failed.
- **Unsure about** — anything you could not verify. Be specific; this is the
  most important section.

Do not commit.
