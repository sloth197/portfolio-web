type HackerNewsItem = {
  id: number;
  title?: string;
  url?: string;
  by?: string;
  time?: number;
  score?: number;
  type?: string;
};

export type HomeNewsItem = {
  id: number;
  title: string;
  url: string;
  author: string;
  publishedAtUnix: number;
  score: number;
};

const TOP_STORIES_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const ITEM_URL = (id: number) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 900 },
      cache: "force-cache",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchHomeTechNews(limit = 6): Promise<HomeNewsItem[]> {
  const ids = await fetchJson<number[]>(TOP_STORIES_URL);
  if (!ids?.length) {
    return [];
  }

  const topIds = ids.slice(0, 24);
  const itemRequests = topIds.map((id) => fetchJson<HackerNewsItem>(ITEM_URL(id)));
  const rawItems = await Promise.all(itemRequests);

  return rawItems
    .filter((item): item is HackerNewsItem => Boolean(item))
    .filter((item) => item.type === "story")
    .filter((item) => Boolean(item.title && item.url && item.time))
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.title as string,
      url: item.url as string,
      author: item.by ?? "unknown",
      publishedAtUnix: item.time as number,
      score: item.score ?? 0,
    }));
}
