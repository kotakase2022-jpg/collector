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
