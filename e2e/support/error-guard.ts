import { expect, type Page, type TestInfo } from "@playwright/test";

type ErrorGuardOptions = {
  allowConsoleError?: (text: string) => boolean;
  allowFailedResponse?: (url: string, status: number) => boolean;
  allowRequestFailed?: (url: string, errorText: string | null | undefined) => boolean;
};

export function installErrorGuards(page: Page, testInfo: TestInfo, options: ErrorGuardOptions = {}) {
  const unexpectedErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      if (options.allowConsoleError?.(message.text())) return;
      unexpectedErrors.push(`console.error: ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    unexpectedErrors.push(`pageerror: ${error.message}`);
  });

  page.on("requestfailed", (request) => {
    if (isAbortedNextRscPrefetch(request.url(), request.failure()?.errorText)) return;
    if (isAbortedFaviconRequest(request.url(), request.failure()?.errorText)) return;
    if (options.allowRequestFailed?.(request.url(), request.failure()?.errorText)) return;
    unexpectedErrors.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`);
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status < 400) return;
    if (options.allowFailedResponse?.(response.url(), status)) return;
    unexpectedErrors.push(`http ${status}: ${response.url()}`);
  });

  return {
    async assertClean() {
      if (unexpectedErrors.length) {
        await testInfo.attach("unexpected-browser-errors", {
          body: unexpectedErrors.join("\n"),
          contentType: "text/plain",
        });
      }
      expect(unexpectedErrors).toEqual([]);
    },
  };
}

function isAbortedNextRscPrefetch(url: string, errorText: string | null | undefined) {
  // Next.js may cancel speculative RSC prefetches during fast navigations; only that narrow abort is non-actionable.
  return url.includes("_rsc=") && errorText === "net::ERR_ABORTED";
}

function isAbortedFaviconRequest(url: string, errorText: string | null | undefined) {
  // Chromium may cancel favicon refreshes during same-origin navigations; this does not affect app behavior.
  return url.includes("/favicon.ico") && errorText === "net::ERR_ABORTED";
}
