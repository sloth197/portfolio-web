export type HomeNewsItem = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
};

const YOZM_FEED_URL = "https://yozm.wishket.com/magazine/feed/";
const ITEM_REGEX = /<item>([\s\S]*?)<\/item>/g;
const FALLBACK_NEWS: HomeNewsItem[] = [
  {
    id: "yozm-latest",
    title: "Read the latest stories on 요즘IT",
    url: "https://yozm.wishket.com/magazine/list/new/",
    publishedAt: "",
    summary: "The latest technology articles are available on 요즘IT.",
  },
];

function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function readTag(xml: string, tag: string): string | null {
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const matched = xml.match(pattern);
  if (!matched?.[1]) {
    return null;
  }

  const raw = matched[1].trim();
  const withoutCdata = raw.startsWith("<![CDATA[") && raw.endsWith("]]>") ? raw.slice(9, -3) : raw;
  return decodeXml(withoutCdata.trim());
}

export async function fetchHomeTechNews(limit = 10): Promise<HomeNewsItem[]> {
  try {
    const response = await fetch(YOZM_FEED_URL, {
      next: { revalidate: 900 },
      cache: "force-cache",
    });
    if (!response.ok) {
      return FALLBACK_NEWS;
    }

    const xml = await response.text();
    const items: HomeNewsItem[] = [];

    for (const matched of xml.matchAll(ITEM_REGEX)) {
      const block = matched[1];
      const title = readTag(block, "title");
      const url = readTag(block, "link");
      const guid = readTag(block, "guid");
      const pubDate = readTag(block, "pubDate");
      const description = readTag(block, "description");

      if (!title || !url) {
        continue;
      }

      items.push({
        id: guid ?? url,
        title,
        url,
        publishedAt: pubDate ?? "",
        summary: description ? stripHtml(description) : "",
      });

      if (items.length >= limit) {
        break;
      }
    }

    return items.length > 0 ? items : FALLBACK_NEWS;
  } catch {
    return FALLBACK_NEWS;
  }
}
