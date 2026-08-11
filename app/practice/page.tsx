import Practice from "./client";
import { graph } from "@/src/graph/bundle";
import { buildPracticeData } from "@/src/practice/model";

export const metadata = {
  title: "Practice · pm-os",
  description:
    "A timed practice session: a real prompt, a stage scaffold weighted by the company's rubric, and a self-check rubric.",
};

/** Assembled server-side so the client receives a view model, not the graph. */
const data = buildPracticeData(graph);

export default function PracticePage() {
  return <Practice data={data} />;
}
