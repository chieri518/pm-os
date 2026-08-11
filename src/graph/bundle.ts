import raw from "../generated/graph.json";
import { GraphIndex, type GraphBundle } from "./index";

/**
 * The compiled graph, for server components and route handlers.
 *
 * The JSON import widens literal types (e.g. "experience" becomes string), so the
 * cast restores the discriminated unions the queries rely on. That is safe because
 * `build-graph` refuses to emit a bundle from content that fails Zod validation —
 * the guarantee is enforced upstream, not assumed here.
 */
export const bundle = raw as unknown as GraphBundle;

/** Module-scoped so every server render reuses one index rather than rebuilding. */
export const graph = GraphIndex.fromBundle(bundle);
