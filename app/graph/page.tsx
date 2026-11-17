import GraphClient from "./client";
import { Nav } from "../nav";

export const metadata = {
  title: "Graph",
  description: "Every concept, term, framework, heuristic and company, and how they connect.",
};

export default function GraphPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav crumb={{ label: "Graph" }} />
      <header className="mb-5 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">The graph</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-300">
          The whole corpus as it actually connects. Authored edges carry a typed relation and a
          reason; mention edges were discovered by scanning prose. Filter by type, hover to isolate.
        </p>
      </header>
      <GraphClient />
    </main>
  );
}
