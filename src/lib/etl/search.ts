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
      const json = (await response.json()) as { results?: SearchResult[] };
      return json.results ?? [];
    },
  };
}
