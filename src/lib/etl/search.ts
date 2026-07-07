export type SearchResult = {
  title: string;
  url: string;
  snippet?: string | null;
};

export type SearchProvider = {
  name: string;
  search: (query: string, limit?: number) => Promise<SearchResult[]>;
};

export function createSearchProvider(): SearchProvider | null {
  if (process.env.SEARCH_API_ENDPOINT) return createHttpSearchProvider();
  return null;
}

export async function discoverOfficialUrlCandidates(input: {
  companyName: string;
  prefecture?: string | null;
  city?: string | null;
  provider?: SearchProvider | null;
}) {
  const provider = input.provider ?? createSearchProvider();
  if (!provider) return [];
  const query = [input.companyName, input.prefecture, input.city, "会社概要"].filter(Boolean).join(" ");
  return provider.search(query, 10);
}

export async function safeDiscoverOfficialUrlCandidates(input: {
  companyName: string;
  prefecture?: string | null;
  city?: string | null;
  provider?: SearchProvider | null;
}) {
  try {
    return await discoverOfficialUrlCandidates(input);
  } catch {
    return [];
  }
}

function createHttpSearchProvider(): SearchProvider {
  return {
    name: "http",
    async search(query, limit = 10) {
      const endpoint = process.env.SEARCH_API_ENDPOINT!;
      const url = new URL(endpoint);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", String(limit));
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(process.env.SEARCH_API_KEY ? { Authorization: `Bearer ${process.env.SEARCH_API_KEY}` } : {}),
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Search API failed: ${response.status}`);
      return readSearchResultsResponse(response);
    },
  };
}

async function readSearchResultsResponse(response: Response) {
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error("Search API response was not JSON");
  }

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("Search API response was not a JSON object");
  }

  const results = (json as { results?: unknown }).results;
  if (results == null) return [];
  if (!Array.isArray(results)) throw new Error("Search API response results were not an array");

  return results.flatMap((item): SearchResult[] => {
    if (!item || typeof item !== "object") return [];
    const record = item as { title?: unknown; url?: unknown; snippet?: unknown };
    if (typeof record.title !== "string" || typeof record.url !== "string") return [];

    const title = record.title.trim();
    const url = record.url.trim();
    if (!title || !isHttpUrl(url)) return [];

    return [
      {
        title,
        url,
        snippet: typeof record.snippet === "string" ? record.snippet.trim() : record.snippet === null ? null : undefined,
      },
    ];
  });
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
