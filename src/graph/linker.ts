import type { GraphIndex } from "./index";
import type { NodeType } from "../schema/primitives";
import type { Concept, CompanyLens, Framework, Heuristic, QuestionType, Term } from "../schema/nodes";

/**
 * Auto-linking, so prose written before the glossary existed becomes hypertext
 * without re-authoring 540 mentions by hand.
 *
 * Pure logic lives here and returns segments; React rendering lives in the app
 * layer. That split keeps the matching testable in plain Node and keeps this file
 * importable from scripts.
 */

export interface LinkTarget {
  key: string;
  id: string;
  type: NodeType;
  href: string;
  label: string;
  /** Shown in the hover preview. */
  summary: string;
}

export type Segment = { text: string; target?: LinkTarget };

export interface LinkIndex {
  /** Lowercased surface form -> target. */
  byPhrase: Map<string, LinkTarget>;
  pattern: RegExp | null;
  targets: LinkTarget[];
  /**
   * Lowercased phrases whose canonical form is an acronym. These only match when
   * written in capitals, so "STAR" links but "North Star" and "star" do not.
   */
  exactCase: Set<string>;
}

/**
 * Surface forms too ambiguous to auto-link. Each of these is a real entity name
 * that is also ordinary English in this corpus — "recall a story", "the precision
 * of the estimate", "structure your answer". Linking them produces confidently
 * wrong destinations, which is worse than no link at all. They remain reachable
 * through explicit see_also and edges.
 */
const DENY = new Set([
  "recall",
  "precision",
  "structure",
  "strategy",
  "technical",
  "behavioral",
  "behavioural",
  "estimation",
  "ownership",
  "frugality",
]);

const HREF: Partial<Record<NodeType, string>> = {
  concept: "/concept",
  heuristic: "/heuristic",
  framework: "/framework",
  question_type: "/question",
  company_lens: "/company",
  term: "/term",
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function buildLinkIndex(graph: GraphIndex): LinkIndex {
  const byPhrase = new Map<string, LinkTarget>();
  const exactCase = new Set<string>();
  const targets: LinkTarget[] = [];

  const add = (type: NodeType, id: string, label: string, summary: string, aka: string[]) => {
    const base = HREF[type];
    if (!base) return;
    const target: LinkTarget = { key: `${type}:${id}`, id, type, href: `${base}/${id}`, label, summary };
    targets.push(target);
    for (const phrase of [label, ...aka]) {
      const k = phrase.toLowerCase().trim();
      if (!k || DENY.has(k) || k.length < 3) continue;
      // First writer wins, so a canonical name is never displaced by someone's alias.
      if (!byPhrase.has(k)) {
        byPhrase.set(k, target);
        if (isAcronym(phrase.trim())) exactCase.add(k);
      }
    }
  };

  for (const t of graph.terms() as Term[]) add("term", t.id, t.name, t.one_line, t.aka);
  for (const c of graph.concepts() as Concept[]) add("concept", c.id, c.name, c.in_one_line, []);
  for (const h of graph.heuristics() as Heuristic[])
    add("heuristic", h.id, h.name, h.claim, h.aka ?? []);
  for (const f of graph.frameworks() as Framework[])
    add("framework", f.id, f.name, f.summary, f.aka ?? []);
  for (const q of graph.questionTypes() as QuestionType[])
    add("question_type", q.id, q.name, q.teaching?.in_one_line ?? "", []);
  for (const l of graph.lenses() as CompanyLens[])
    add("company_lens", l.id, l.company, l.philosophy, []);

  // Longest phrases first so "loss aversion" wins over "loss", and "working
  // memory" over "memory". Regex alternation is ordered, so sort order is the
  // whole mechanism here.
  const phrases = [...byPhrase.keys()].sort((a, b) => b.length - a.length);
  const pattern = phrases.length
    ? new RegExp(`(?<![\\w-])(${phrases.map(escapeRe).join("|")})(?![\\w-])`, "gi")
    : null;

  return { byPhrase, pattern, targets, exactCase };
}

const isAcronym = (s: string) => /^[A-Z][A-Z0-9&]+$/.test(s);

/** Resolve one regex match to its target, applying the acronym case rule. */
function resolve(matched: string, index: LinkIndex): LinkTarget | undefined {
  const k = matched.toLowerCase();
  if (index.exactCase.has(k) && matched !== matched.toUpperCase()) return undefined;
  return index.byPhrase.get(k);
}

/**
 * Every target mentioned anywhere in `text`, using exactly the same matching as
 * on-page links. Build-time backlinks used to use substring search instead, which
 * found "STAR" inside "start" and "standard" and "spec" inside "specific" — so the
 * graph showed both as the corpus's biggest hubs on the strength of words that
 * were never references at all.
 */
export function findMentions(text: string, index: LinkIndex, selfKey?: string): Set<string> {
  const found = new Set<string>();
  if (!index.pattern || !text) return found;
  index.pattern.lastIndex = 0;
  for (let m = index.pattern.exec(text); m; m = index.pattern.exec(text)) {
    const target = resolve(m[0], index);
    if (target && target.key !== selfKey) found.add(target.key);
  }
  return found;
}

/**
 * Split text into linked and unlinked segments.
 *
 * `seen` is shared across one page render so only the FIRST mention of a given
 * target becomes a link. Without that, a page mentioning "churn" nine times turns
 * into blue soup and the links stop reading as signal.
 */
export function segment(
  text: string,
  index: LinkIndex,
  seen: Set<string>,
  selfKey?: string
): Segment[] {
  if (!index.pattern || !text) return [{ text }];
  const out: Segment[] = [];
  let last = 0;

  index.pattern.lastIndex = 0;
  for (let m = index.pattern.exec(text); m; m = index.pattern.exec(text)) {
    const matched = m[0];
    const target = resolve(matched, index);
    if (!target || target.key === selfKey || seen.has(target.key)) continue;

    seen.add(target.key);
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: matched, target });
    last = m.index + matched.length;
  }

  if (last < text.length) out.push({ text: text.slice(last) });
  return out.length ? out : [{ text }];
}
