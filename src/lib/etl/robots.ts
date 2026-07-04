import robotsParser from "robots-parser";

export type RobotsPolicy = {
  robotsUrl: string;
  canFetch: (url: string) => boolean;
  crawlDelayMs: number;
};

const defaultUserAgent = "JapanCompanyCollector/0.1 (+https://example.invalid/compliance)";

export async function loadRobotsPolicy(siteUrl: string, userAgent = defaultUserAgent): Promise<RobotsPolicy> {
  const origin = new URL(siteUrl).origin;
  const robotsUrl = `${origin}/robots.txt`;

  try {
    const response = await fetch(robotsUrl, {
      headers: { "user-agent": userAgent },
      signal: AbortSignal.timeout(8000),
    });
    const body = response.ok ? await response.text() : "";
    const parser = robotsParser(robotsUrl, body);
    const delay = parser.getCrawlDelay(userAgent);

    return {
      robotsUrl,
      canFetch: (url) => parser.isAllowed(url, userAgent) !== false,
      crawlDelayMs: Math.max(1000, delay ? delay * 1000 : 3000),
    };
  } catch {
    return {
      robotsUrl,
      canFetch: () => false,
      crawlDelayMs: 5000,
    };
  }
}

export function createRobotsPolicyFromText(robotsUrl: string, body: string, userAgent = defaultUserAgent): RobotsPolicy {
  const parser = robotsParser(robotsUrl, body);
  const delay = parser.getCrawlDelay(userAgent);
  return {
    robotsUrl,
    canFetch: (url) => parser.isAllowed(url, userAgent) !== false,
    crawlDelayMs: Math.max(1000, delay ? delay * 1000 : 3000),
  };
}

export async function assertRobotsAllowed(url: string, userAgent = defaultUserAgent) {
  const policy = await loadRobotsPolicy(url, userAgent);
  if (!policy.canFetch(url)) {
    throw new Error(`robots.txt disallows fetching ${url}`);
  }
  return policy;
}
