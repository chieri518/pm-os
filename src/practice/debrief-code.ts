/**
 * A mock interview's debrief, packed into a URL fragment.
 *
 * The site is static and has no accounts, and a debrief is a candid note about a
 * named person — so it never touches a server. The interviewer's browser encodes
 * it into the part of the link after `#`, which browsers do not send in requests,
 * and the candidate's browser decodes it. Whoever holds the link holds the debrief.
 *
 * Content is referenced by position in the guide rather than copied, which keeps
 * links short. If a guide is later edited, an out-of-range index is dropped rather
 * than misread.
 */

export interface DebriefPayload {
  v: 1;
  /** Observed signals, as "groupIndex.signalIndex". */
  s: string[];
  /** Anti-signals observed, by index. */
  a: number[];
  /** Pre-written plus lines chosen, by index. */
  p: number[];
  /** Pre-written delta lines chosen, by index. */
  d: number[];
  /** Free-text plus, in the interviewer's own words. */
  pn?: string;
  /** Free-text delta, in the interviewer's own words. */
  dn?: string;
}

export const signalKey = (group: number, signal: number) => `${group}.${signal}`;
export const antiKey = (i: number) => `a${i}`;

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeDebrief(p: DebriefPayload): string {
  const compact: DebriefPayload = { ...p };
  if (!compact.pn?.trim()) delete compact.pn;
  if (!compact.dn?.trim()) delete compact.dn;
  return toBase64Url(new TextEncoder().encode(JSON.stringify(compact)));
}

const isIntArray = (x: unknown): x is number[] =>
  Array.isArray(x) && x.every((n) => Number.isInteger(n) && n >= 0);

/** Returns null for anything that is not a well-formed v1 payload. */
export function decodeDebrief(code: string): DebriefPayload | null {
  try {
    const raw = JSON.parse(new TextDecoder().decode(fromBase64Url(code))) as Record<string, unknown>;
    if (raw.v !== 1) return null;
    const s = Array.isArray(raw.s) ? raw.s.filter((k): k is string => typeof k === "string" && /^\d+\.\d+$/.test(k)) : [];
    return {
      v: 1,
      s,
      a: isIntArray(raw.a) ? raw.a : [],
      p: isIntArray(raw.p) ? raw.p : [],
      d: isIntArray(raw.d) ? raw.d : [],
      pn: typeof raw.pn === "string" ? raw.pn.slice(0, 2000) : undefined,
      dn: typeof raw.dn === "string" ? raw.dn.slice(0, 2000) : undefined,
    };
  } catch {
    return null;
  }
}
