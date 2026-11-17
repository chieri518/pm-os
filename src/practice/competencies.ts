/** Display labels for the five core competencies, in a stable order. */
export const COMPETENCIES = [
  { id: "ambiguity-scoping", label: "Ambiguity & scoping" },
  { id: "segmentation", label: "Segmentation" },
  { id: "jtbd-pain-points", label: "Jobs & pain points" },
  { id: "prioritisation-tradeoffs", label: "Prioritisation & trade-offs" },
  { id: "metrics-guardrails", label: "Metrics & guardrails" },
] as const;

export const competencyLabel = (id: string) =>
  COMPETENCIES.find((c) => c.id === id)?.label ?? id;
