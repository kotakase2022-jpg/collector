import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["src", "tests", "e2e", "scripts"].map((item) => path.join(root, item));
const testRoots = ["tests", "e2e"].map((item) => path.join(root, item));
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const selfFile = path.join(root, "scripts", "quality-guard.ts");

const forbiddenPatterns = [
  { label: "test.only", pattern: /\btest\.only\s*\(/ },
  { label: "describe.only", pattern: /\bdescribe\.only\s*\(/ },
  { label: "it.only", pattern: /\bit\.only\s*\(/ },
  { label: "test.skip", pattern: /\btest\.skip\s*\(/ },
  { label: "describe.skip", pattern: /\bdescribe\.skip\s*\(/ },
  { label: "it.skip", pattern: /\bit\.skip\s*\(/ },
  { label: "test.todo", pattern: /\btest\.todo\s*\(/ },
  { label: "it.todo", pattern: /\bit\.todo\s*\(/ },
];

async function main() {
  const files = (await Promise.all(scanRoots.map((dir) => listFiles(dir)))).flat();
  const testFiles = files.filter((file) => isUnderAny(file, testRoots) && /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file));
  const errors: string[] = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    if (path.resolve(file) !== path.resolve(selfFile)) {
      for (const rule of forbiddenPatterns) {
        if (rule.pattern.test(content)) errors.push(`${relative(file)} contains forbidden ${rule.label}`);
      }
    }
    const largeComment = detectLargeCommentBlock(content);
    if (largeComment) errors.push(`${relative(file)} has suspicious large comment block: ${largeComment}`);
  }

  if (testFiles.length === 0) errors.push("No test files found under tests/ or e2e/.");
  if (!testFiles.some((file) => file.includes(`${path.sep}e2e${path.sep}`))) errors.push("No E2E spec files found.");

  for (const file of testFiles) {
    const content = await readFile(file, "utf8");
    const blocks = extractTestBlocks(content);
    if (blocks.length === 0) {
      errors.push(`${relative(file)} has no executable test()/it() blocks.`);
      continue;
    }
    blocks.forEach((block, index) => {
      if (!hasAssertion(block)) {
        errors.push(`${relative(file)} test block #${index + 1} has no clear assertion/expectation.`);
      }
    });
  }

  if (errors.length) {
    console.error(["Quality guard failed:", ...errors.map((error) => `- ${error}`)].join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`Quality guard passed (${files.length} source files, ${testFiles.length} test files).`);
}

async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (["node_modules", ".next", "coverage", "playwright-report", "test-results"].includes(entry.name)) return [];
          return listFiles(fullPath);
        }
        if (!sourceExtensions.has(path.extname(entry.name))) return [];
        return [fullPath];
      }),
    );
    return nested.flat();
  } catch {
    return [];
  }
}

function detectLargeCommentBlock(content: string) {
  const lines = content.split(/\r?\n/);
  let consecutive = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith("//")) {
      consecutive += 1;
      if (consecutive >= 15) return `15+ consecutive // lines ending near line ${index + 1}`;
    } else if (line && !line.startsWith("*")) {
      consecutive = 0;
    }
  }

  const blockMatches = content.match(/\/\*[\s\S]*?\*\//g) ?? [];
  const largeBlock = blockMatches.find((block) => block.split(/\r?\n/).length >= 40);
  return largeBlock ? "40+ line block comment" : null;
}

function extractTestBlocks(content: string) {
  const starts = [...content.matchAll(/\b(?:test|it)\s*\(/g)].map((match) => match.index ?? 0);
  return starts.map((start) => {
    const arrowStart = content.indexOf("=>", start);
    const functionStart = content.indexOf("function", start);
    const bodySearchStart = arrowStart === -1 ? (functionStart === -1 ? start : functionStart) : arrowStart;
    const braceStart = content.indexOf("{", bodySearchStart);
    if (braceStart === -1) return "";
    let depth = 0;
    for (let index = braceStart; index < content.length; index += 1) {
      const char = content[index];
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (depth === 0) return content.slice(braceStart, index + 1);
    }
    return content.slice(braceStart);
  });
}

function hasAssertion(block: string) {
  return /\b(expect|assert)\s*\(/.test(block);
}

function isUnderAny(file: string, dirs: string[]) {
  return dirs.some((dir) => file.startsWith(dir + path.sep));
}

function relative(file: string) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
