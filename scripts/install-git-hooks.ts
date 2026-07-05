import { chmodSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

if (!existsSync(".git") || !existsSync(".githooks")) {
  process.exit(0);
}

if (process.platform !== "win32") {
  for (const hook of [".githooks/pre-commit", ".githooks/pre-push"]) {
    if (existsSync(hook)) chmodSync(hook, 0o755);
  }
}

execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });
