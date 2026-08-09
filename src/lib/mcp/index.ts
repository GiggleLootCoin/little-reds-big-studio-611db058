import { defineMcp } from "@lovable.dev/mcp-js";

/** Optional MCP surface. It is deliberately unauthenticated and contains no Supabase dependency. */
export default defineMcp({
  name: "little-reds-big-studio",
  title: "Little Red's Big Studio",
  version: "2.0.0",
  instructions: "Little Red's Big Studio is local-first. AI execution uses free open-source runners; no hosted database or provider API key is required.",
  tools: [],
});
