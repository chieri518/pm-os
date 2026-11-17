import type { MetadataRoute } from "next";
import { graph } from "@/src/graph/bundle";
import { SITE_URL } from "@/src/site";

/* Every statically generated page, derived from the corpus so it cannot drift. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/library",
    "/glossary",
    "/graph",
    "/interviewer",
    "/interviewer/running-a-session",
    ...graph.guides().map((g) => `/interviewer/${g.id}`),
    ...graph.questionTypes().map((q) => `/question/${q.id}`),
    ...graph.concepts().map((c) => `/concept/${c.id}`),
    ...graph.frameworks().map((f) => `/framework/${f.id}`),
    ...graph.heuristics().map((h) => `/heuristic/${h.id}`),
    ...graph.lenses().map((l) => `/company/${l.id}`),
    ...graph.terms().map((t) => `/term/${t.id}`),
  ];

  return paths.map((p) => ({ url: `${SITE_URL}${p === "/" ? "" : p}` }));
}
