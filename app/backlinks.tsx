import Link from "next/link";
import type { Route } from "next";
import { graph } from "@/src/graph/bundle";
import { buildLinkIndex } from "@/src/graph/linker";
import type { NodeRef, NodeType } from "@/src/schema/primitives";
import type { RelationType } from "@/src/schema/edges";
import inbound from "@/src/generated/mentions.json";
import { Section } from "./teaching";

const index = buildLinkIndex(graph);
const byKey = new Map(index.targets.map((t) => [t.key, t]));
const MENTIONS = inbound as Record<string, string[]>;

/**
 * Why this beats a wiki backlink.
 *
 * Obsidian can only say "these two notes mention each other". Our edges carry a
 * relation type AND an authored rationale, so an incoming link can say what the
 * relationship IS and what to do about it — "TENSIONS_WITH: resolve toward Hick's
 * when the user is under load". That rationale was written once on the edge and is
 * read here, on the concept page, and in the practice builder.
 *
 * Two kinds of inbound link are shown separately and deliberately:
 *   authored edges  — curated, typed, carry reasoning
 *   prose mentions  — discovered at build time, no claim beyond co-occurrence
 */

const RELATION_COPY: Partial<Record<RelationType, string>> = {
  REQUIRES: "Assumed knowledge for",
  SURFACES_AT: "Deployed at",
  TENSIONS_WITH: "In tension with",
  SPECIALIZES: "Specialises",
  APPLIES_TO: "Applies to",
  WEIGHTS: "Weighted by",
  TYPICAL_FOR: "Typical for",
  ASKED_BY: "Asked by",
  ANSWERED_WITH: "Answered with",
};

const TYPE_COPY: Record<string, string> = {
  term: "term",
  concept: "concept",
  heuristic: "heuristic",
  framework: "framework",
  question_type: "question",
  company_lens: "company",
};

export function Backlinks({ type, id }: { type: NodeType; id: string }) {
  const ref: NodeRef = { type, id };
  const key = `${type}:${id}`;

  const grouped = new Map<RelationType, { href: string; label: string; rationale: string }[]>();
  for (const edge of graph.edgesTo(ref)) {
    const other = graph.otherEnd(edge, ref);
    const target = byKey.get(`${other.type}:${other.id}`);
    if (!target) continue;
    const list = grouped.get(edge.relation) ?? [];
    list.push({ href: target.href, label: target.label, rationale: edge.rationale });
    grouped.set(edge.relation, list);
  }

  // Prose mentions, minus anything already shown as an authored edge.
  const shown = new Set([...grouped.values()].flat().map((r) => r.href));
  const mentions = (MENTIONS[key] ?? [])
    .map((k) => byKey.get(k))
    .filter((t): t is NonNullable<typeof t> => Boolean(t) && !shown.has(t!.href))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (grouped.size === 0 && mentions.length === 0) return null;

  return (
    <Section title="What links here" note="Authored relationships carry their reasoning.">
      {[...grouped.entries()].map(([relation, items]) => (
        <div key={relation} className="mb-4 last:mb-0">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
            {RELATION_COPY[relation] ?? relation}
          </div>
          <div className="space-y-2">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href as Route}
                className="block rounded-lg border border-ink-800 bg-ink-900/60 p-3 transition-colors hover:border-ink-600 hover:bg-ink-850"
              >
                <div className="text-[14px] font-medium text-ink-100">{it.label}</div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-300">{it.rationale}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {mentions.length > 0 && (
        <div className={grouped.size > 0 ? "mt-4 border-t border-ink-800 pt-3" : ""}>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
            Mentioned in {mentions.length}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {mentions.map((m) => (
              <Link
                key={m.key}
                href={m.href as Route}
                className="rounded-full border border-ink-800 bg-ink-850 px-2.5 py-1 text-[12px] text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
              >
                {m.label}
                <span className="ml-1.5 font-mono text-[9px] uppercase text-ink-600">
                  {TYPE_COPY[m.type] ?? m.type}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
