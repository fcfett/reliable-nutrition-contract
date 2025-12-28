import { serve } from "bun";
import sourceA from "./data/entries.source-a.json";
import sourceB from "./data/entries.source-b.json";
import sourceC from "./data/entries.source-c.json";
import sourceD from "./data/entries.source-d.json";
import { normalizeEntries } from "./normalize";

const API_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};

const SOURCE_NOT_FOUND_ERROR = {
  statusText: "Source Not Found",
  status: 400
}

const sources: Record<string, Object> = {
  a: sourceA,
  b: sourceB,
  c: sourceC,
  d: sourceD
};

const parseDataSource = (dataSource?: Object) => {
  if (!dataSource) return undefined

  return {data: normalizeEntries(dataSource as unknown[])};
}

const server = serve({
  port: 3000,
  routes: {
    "/:source": async req => {
      const dataSource = parseDataSource(sources[req.params.source]);
      return new Response(
        JSON.stringify(dataSource ?? SOURCE_NOT_FOUND_ERROR),
        {
          headers: API_HEADERS,
          ...(!dataSource && SOURCE_NOT_FOUND_ERROR)
        }
      );
    },
  }
});

console.info(`API listening on ${server.url}`);