/**
 * The canonical origin, used wherever a fully qualified URL is required — sitemap,
 * robots, and `metadataBase` for share cards.
 *
 * Set NEXT_PUBLIC_SITE_URL once a custom domain exists. Until then, on Vercel the
 * production URL is picked up automatically, and locally it falls back to the dev
 * server so builds never fail for want of a domain.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "pm-os";
export const SITE_TAGLINE = "PM interview prep, from both sides of the table";
export const SITE_DESCRIPTION =
  "Interviewer guides that show what actually gets scored — situation briefs, probe ladders, signal checklists and bias guards — plus question types, concepts and company lenses with the research checked and the contested claims labelled.";
