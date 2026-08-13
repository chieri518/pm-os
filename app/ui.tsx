export function EvidenceTag({ strength }: { strength: string }) {
  const styles: Record<string, string> = {
    replicated: "border-live-600/40 bg-live-600/10 text-live-400",
    supported: "border-ink-600 bg-ink-800 text-ink-300",
    heuristic: "border-ink-700 bg-ink-850 text-ink-400",
    contested: "border-warn-400/40 bg-warn-400/10 text-warn-400",
  };
  return (
    <span
      className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        styles[strength] ?? styles.heuristic
      }`}
    >
      {strength}
    </span>
  );
}
