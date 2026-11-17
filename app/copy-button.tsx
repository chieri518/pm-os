"use client";

import { useState } from "react";

/**
 * Copies text produced at click time. When the clipboard is refused (older
 * browsers, some embedded views), it shows the text in a selected field instead,
 * so the person can always copy it by hand.
 */
export function CopyButton({
  getText,
  path,
  label,
  primary = false,
}: {
  /** Builds the text at click time. Only usable from client components. */
  getText?: () => string;
  /** A site path to copy as a full URL — the form server components can pass. */
  path?: string;
  label: string;
  primary?: boolean;
}) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const [manual, setManual] = useState("");

  const copy = async () => {
    const text = getText ? getText() : `${window.location.origin}${path ?? ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setManual(text);
      setState("manual");
    }
  };

  return (
    <span className="inline-flex flex-col gap-1.5">
      <button
        type="button"
        onClick={copy}
        className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
          primary
            ? "border-live-600/50 bg-live-600/10 font-medium text-live-400 hover:bg-live-600/20"
            : "border-ink-700 bg-ink-850 text-ink-100 hover:border-ink-600"
        }`}
      >
        {state === "copied" ? "Copied" : label}
      </button>
      {state === "manual" && (
        <input
          readOnly
          value={manual}
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          aria-label="Copy this text"
          className="w-full min-w-0 rounded-md border border-ink-700 bg-ink-900 px-2 py-1 font-mono text-[11px] text-ink-300"
        />
      )}
    </span>
  );
}
