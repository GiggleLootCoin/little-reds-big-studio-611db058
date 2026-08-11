export type WebResult = { title: string; url: string; snippet: string; source: string };

const JINA = "https://r.jina.ai/";
const SEARCH_TIMEOUT = 15_000;

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
function decode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/plain,text/markdown,*/*" },
    });
    if (!response.ok) throw new Error(`Web request failed: ${response.status}`);
    return await response.text();
  } finally {
    window.clearTimeout(timer);
  }
}

function parseMarkdownSearch(markdown: string): WebResult[] {
  const results: WebResult[] = [];
  const lines = markdown.split("\n");
  for (let index = 0; index < lines.length && results.length < 8; index += 1) {
    const line = lines[index].trim();
    const match = line.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!match) continue;
    const title = clean(match[1]);
    const url = match[2];
    if (!title || url.includes("duckduckgo.com")) continue;
    const snippet = clean(lines.slice(index + 1, index + 4).join(" ")).slice(0, 360);
    results.push({ title, url, snippet, source: new URL(url).hostname.replace(/^www\./, "") });
  }
  return results;
}

export function shouldResearch(text: string) {
  return /\b(search|research|look up|find out|latest|today|current|recent|news|what's happening|what is happening|who is|how much|price|weather|trending|verify|fact[- ]?check|source|sources)\b/i.test(
    text,
  );
}

export async function liveWebSearch(query: string): Promise<WebResult[]> {
  const encoded = encodeURIComponent(query.trim());
  const targets = [
    `${JINA}https://html.duckduckgo.com/html/?q=${encoded}`,
    `${JINA}https://www.bing.com/search?q=${encoded}`,
  ];
  for (const target of targets) {
    try {
      const markdown = await fetchText(target);
      const parsed = parseMarkdownSearch(markdown);
      if (parsed.length) return parsed;
    } catch (error) {
      console.warn("Buddy web search route failed", error);
    }
  }
  return [];
}

export async function researchWeb(query: string) {
  const results = await liveWebSearch(query);
  if (!results.length)
    return "I couldn't reach a live search source right now, so I won't pretend I checked the web.";
  return [
    "Live web research:",
    ...results
      .slice(0, 6)
      .map(
        (result, index) =>
          `${index + 1}. ${result.title}\n${result.source}\n${result.snippet}\n${result.url}`,
      ),
  ].join("\n\n");
}

export function sourceLabel(url: string) {
  try {
    return new URL(decode(url)).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}
