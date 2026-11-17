import { ImageResponse } from "next/og";
import { graph } from "@/src/graph/bundle";
import { SITE_TAGLINE } from "@/src/site";

/*
 * The share card for every route. Generated at build time, so the counts below are
 * always the live corpus rather than a number someone forgot to update.
 */

export const alt = `pm-os — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK_950 = "#0a0b0d";
const INK_800 = "#1c1f24";
const INK_400 = "#7d858f";
const INK_300 = "#a2aab4";
const INK_100 = "#e7eaee";
const LIVE = "#34d399";
const WARN = "#fbbf24";

export default function Image() {
  const stats = [
    `${graph.guides().length} interviewer guides`,
    `${graph.questionTypes().length} question types`,
    `${graph.concepts().length} concepts`,
    `${graph.lenses().length} company lenses`,
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK_950,
          padding: "72px 80px",
          color: INK_100,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <path
              d="M11 11.5 L21.5 15 M11 11.5 L14.5 22"
              stroke={LIVE}
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.55"
            />
            <circle cx="11" cy="11.5" r="4" fill={LIVE} />
            <circle cx="21.5" cy="15" r="2.6" fill={INK_950} stroke={LIVE} strokeWidth="1.6" />
            <circle cx="14.5" cy="22" r="2.6" fill={INK_950} stroke={LIVE} strokeWidth="1.6" />
          </svg>
          <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: -0.5 }}>pm-os</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1.5 }}>
            PM interview prep, from both sides of the table.
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: INK_300, maxWidth: 960 }}>
            What the interviewer actually scores — and which famous claims the evidence
            does not support.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${INK_800}`,
            paddingTop: 28,
            fontSize: 22,
            color: INK_400,
          }}
        >
          <div style={{ display: "flex", gap: 28 }}>
            {stats.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <span style={{ color: WARN }}>contested ≠ settled</span>
        </div>
      </div>
    ),
    size,
  );
}
