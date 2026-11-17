import GraphClient from "./client";
import { Nav } from "../nav";

export const metadata = {
  title: "Graph",
  description:
    "Start from a question type and walk the connections — which frameworks fit it, what it assumes you know, which companies weight it, and why.",
};

export default function GraphPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
      <Nav crumb={{ label: "Graph" }} />
      <header className="mb-5 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">The graph</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-300">
          Start from a question and follow what it connects to. Solid links were written by hand
          and say why they exist; dashed ones were found by reading the prose. Click anything to
          move the centre there.
        </p>
      </header>
      <GraphClient />
    </main>
  );
}
