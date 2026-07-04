import { expect, type Page, type TestInfo } from "@playwright/test";

type ErrorGuardOptions = {
  allowConsoleError?: (text: string) => boolean;
  allowFailedResponse?: (url: string, status: number) => boolean;
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
