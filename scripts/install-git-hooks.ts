import { chmodSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

type InstallGitHooksOptions = {
  exists?: (path: string) => boolean;
  chmod?: (path: string, mode: number) => void;
  execFile?: (file: string, args: string[], options: { stdio: "inherit" }) => void;
  platform?: NodeJS.Platform;
  warn?: (message: string) => void;
};

export function installGitHooks({
  exists = existsSync,
  chmod = chmodSync,
  execFile = execFileSync,
  platform = process.platform,
  warn = console.warn,
}: InstallGitHooksOptions = {}) {
  if (!exists(".git") || !exists(".githooks")) return;

  if (platform !== "win32") {
    for (const hook of [".githooks/pre-commit", ".githooks/pre-push"]) {
      if (exists(hook)) chmod(hook, 0o755);
    }
  }

  try {
    execFile("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });
  } catch (error) {
    if (isMissingGit(error)) {
      warn("Git was not found; skipping local hook installation.");
      return;
    }
    throw error;
  }
}

function isMissingGit(error: unknown) {
  return typeof error === "object" && error != null && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  installGitHooks();
}
