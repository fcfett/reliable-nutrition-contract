import { serve } from "bun";
import sourceA from "../data/entries.source-a.json";
import sourceB from "../data/entries.source-b.json";
import sourceC from "../data/entries.source-c.json";
import sourceD from "../data/entries.source-d.json";

const sources: Record<string, unknown> = {
  a: sourceA,
  b: sourceB,
  c: sourceC,
  d: sourceD
};

serve({
  port: 3001,
  fetch(req) {
    const url = new URL(req.url);
    const source = url.searchParams.get("source") ?? "a";
    return new Response(JSON.stringify(sources[source] ?? []), {
      headers: { "Content-Type": "application/json" }
    });
  }
});