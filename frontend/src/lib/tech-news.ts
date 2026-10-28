export type HomeNewsItem = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
};

const HACKER_NEWS_API = "https://hacker-news.firebaseio.com/v0";
const HACKER_NEWS_HOME = "https://news.ycombinator.com/";
const FALLBACK_NEWS: HomeNewsItem[] = [
  { id: "hn-1", title: "Explore developer news on Hacker News", url: HACKER_NEWS_HOME, publishedAt: "", summary: "Developer news, tools, and technical discussions from the community." },
  { id: "hn-2", title: "Discover new developer tools", url: HACKER_NEWS_HOME, publishedAt: "", summary: "Find interesting projects, libraries, and engineering ideas." },
  { id: "hn-3", title: "Read the latest engineering stories", url: HACKER_NEWS_HOME, publishedAt: "", summary: "A broad selection of current technology and software topics." },
];

type HackerNewsItem = { id: number; title?: string; url?: string; text?: string; time?: number; score?: number };

const DEVELOPMENT_TITLE_TERMS = /\b(?:api|backend|browser|cloud|code|coding|database|developer|development|devops|docker|framework|frontend|git|github|javascript|kubernetes|linux|mcp|open.?source|programming|python|react|rust|software|sql|typescript|web|workflow|ai|llm|npm|node(?:\.js)?|next\.js|css|html|wasm|compiler|repository|linux|security|testing|observability)\b/i;
const DEVELOPMENT_DOMAINS = /(?:github\.com|gitlab\.com|stackoverflow\.com|developer\.mozilla\.org|developer\.apple\.com|developer\.android\.com|docs\.|npmjs\.com|pypi\.org|modelcontextprotocol\.io)/i;
const NON_DEVELOPMENT_TERMS = /\b(?:election|politics|president|government|stock|crypto|market|finance|health|medicine|climate|war|court|law|food|travel|movie|music|sports|paper|research)\b/i;

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&#x2F;|&#47;|&sol;/gi, "/").replace(/&#x3A;|&#58;/gi, ":").replace(/&#x3F;|&#63;/gi, "?").replace(/&#x3D;|&#61;/gi, "=").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/gi, "'").replace(/\s+/g, " ").trim();
}

function getSummary(item: HackerNewsItem): string {
  const summary = item.text ? stripHtml(item.text) : "";
  if (!summary || /^(?:https?:\/\/|www\.)/i.test(summary) || (summary.match(/https?:\/\//gi)?.length ?? 0) > 1) {
    return "Developer news and technical discussion from Hacker News.";
  }
  return summary;
}

function isDocumentLink(item: HackerNewsItem): boolean {
  const title = item.title ?? "";
  const url = item.url ?? "";
  return /(?:\.pdf(?:$|[?#])|\[\s*pdf\s*\]|\bpdf\b)/i.test(`${title} ${url}`);
}

function isDevelopmentStory(item: HackerNewsItem): boolean {
  const title = item.title ?? "";
  if (NON_DEVELOPMENT_TERMS.test(title)) return false;
  return DEVELOPMENT_TITLE_TERMS.test(title) || DEVELOPMENT_DOMAINS.test(item.url ?? "");
}

export async function fetchHomeTechNews(limit = 3): Promise<HomeNewsItem[]> {
  try {
    const idsResponse = await fetch(`${HACKER_NEWS_API}/beststories.json`, { next: { revalidate: 900 }, cache: "force-cache" });
    if (!idsResponse.ok) return FALLBACK_NEWS;
    // Thirty candidates are enough to find the three developer-focused stories
    // while avoiding fifty parallel item requests on every revalidation.
    const ids = (await idsResponse.json() as number[]).slice(0, 30);
    const items = await Promise.all(ids.map(async (id) => {
      const response = await fetch(`${HACKER_NEWS_API}/item/${id}.json`, { next: { revalidate: 900 }, cache: "force-cache" });
      return response.ok ? await response.json() as HackerNewsItem : null;
    }));
    const news = items.filter((item): item is HackerNewsItem => item !== null && Boolean(item.title) && !isDocumentLink(item) && isDevelopmentStory(item)).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((item) => ({
      id: String(item.id), title: item.title!, url: item.url ?? `${HACKER_NEWS_HOME}item?id=${item.id}`,
      publishedAt: item.time ? new Date(item.time * 1000).toISOString() : "",
      summary: getSummary(item),
    }));
    return news.length > 0 ? news.slice(0, limit) : FALLBACK_NEWS;
  } catch {
    return FALLBACK_NEWS;
  }
}
