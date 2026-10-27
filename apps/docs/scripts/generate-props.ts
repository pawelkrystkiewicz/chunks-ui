/// <reference types="@types/bun" />
/**
 * Writes the props tables of the docs pages as markdown, one file per page: Context7 indexes the
 * MDX source (`content/` and `props/`), not the tables the pages render at build time.
 * For each `generateDefinition({ code })` call in `content/**\/*.mdx`, it calls Nextra's
 * `generateDefinition` with the same `code` and writes the entries as a table under the nearest
 * heading above the call: `content/components/button.mdx` → `props/components/button.md`.
 * Needs `chunks-ui` built first: the types resolve through the built package.
 *
 * A call passes `code` alone, as a template literal without `${}`. Any other call shape, a code
 * fence left open, and a result with no props table fail the run with the .mdx line rather than
 * going unread.
 *
 * Run: bun run generate:props (`check:props` writes nothing and exits 1 on any difference)
 */
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { TypeField } from "nextra/tsdoc";

const DOCS_DIR = join(import.meta.dirname, "..");
const CONTENT_DIR = join(DOCS_DIR, "content");
const PROPS_DIR = join(DOCS_DIR, "props");
// From the repo root. Builds first: a JSDoc edit is not in the tables until chunks-ui is rebuilt.
const FIX = "bun run build --filter=chunks-ui && bun run --cwd apps/docs generate:props";

export type GenerateDefinition = typeof import("nextra/tsdoc").generateDefinition;
/** A `generateDefinition` call: its .mdx line and its `code` */
type Call = { line: number; code: string };
/** The calls under one heading of a page */
type Section = { heading: string; headingLine: number; calls: Call[] };

const FENCE = /^\s*(`{3,}|~{3,})/;
const CLOSE = /^\s*(`{3,}|~{3,})\s*$/;
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const CALL_START = /generateDefinition\s*\(/;
/** The one call shape the pages use: `code` alone, as a template literal */
const CALL = /generateDefinition\(\{\s*code:\s*`([^`\\]*)`,?\s*\}\)/y;

/**
 * Finds the `generateDefinition` calls of one page, grouped by the heading above them, and the
 * page's first `# ` heading. Fenced code is skipped, so a call or a `#` line shown in a code block
 * is not read. Throws, naming the .mdx line, on a call it cannot read and on a fence left open.
 */
export function extractBlocks(page: string, source: string) {
  const lines = source.split("\n");
  const sections: Section[] = [];
  let title: string | undefined;
  let heading: { line: number; text: string } | undefined;
  // The marker (``` or ~~~, any length) of the fence we are in, and the line it opened on
  let fence: string | null = null;
  let fenceLine = 0;
  // Where line i starts in source
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i] ?? "";
    const start = offset;
    offset += text.length + 1;
    if (fence) {
      const marker = CLOSE.exec(text)?.[1];
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    fence = FENCE.exec(text)?.[1] ?? null;
    if (fence) {
      fenceLine = i + 1;
      continue;
    }
    const match = HEADING.exec(text);
    if (match) {
      heading = { line: i + 1, text: match[2] ?? "" };
      if (match[1] === "#") title ??= heading.text;
      continue;
    }
    const column = text.search(CALL_START);
    if (column === -1) continue;

    const at = `content/${page}:${i + 1}`;
    CALL.lastIndex = start + column;
    const code = CALL.exec(source)?.[1];
    if (code === undefined || code.includes("${")) {
      throw new Error(
        `${at} - unreadable generateDefinition call: pass \`code\` alone, as a template literal without \${}, or teach generate-props.ts the new shape`,
      );
    }
    if (!heading) throw new Error(`${at} - no heading above the generateDefinition call`);
    const last = sections.at(-1);
    const call = { line: i + 1, code };
    if (last?.headingLine === heading.line) last.calls.push(call);
    else sections.push({ heading: heading.text, headingLine: heading.line, calls: [call] });
    // Skip the rest of the lines the call spans
    while (offset < CALL.lastIndex && i < lines.length - 1) {
      i++;
      offset += (lines[i]?.length ?? 0) + 1;
    }
    // i is the call's last line: its remainder is not scanned again, so a second call there
    // would go unread while check:props passes
    const endLine = lines[i] ?? "";
    if (CALL_START.test(endLine.slice(CALL.lastIndex - (offset - endLine.length - 1)))) {
      throw new Error(
        `content/${page}:${i + 1} - a second generateDefinition call on the line where the one before it ends: put each call on its own line`,
      );
    }
  }
  // A fence left open hides the rest of the page: its calls would go unread, check:props passing
  if (fence) {
    throw new Error(
      `content/${page}:${fenceLine} - code fence left open: close it, or the rest of the page goes unread`,
    );
  }
  return { title, sections };
}

/** Newlines in a table cell end the row: they become spaces */
const flatten = (text: string) => text.replace(/\s*\n\s*/g, " ").trim();
const escapePipes = (text: string) => text.replaceAll("|", "\\|");

/** A code span that holds `text` even when it contains backticks */
function codeSpan(text: string) {
  const flat = flatten(text);
  const longest = Math.max(0, ...(flat.match(/`+/g) ?? []).map((run) => run.length));
  const ticks = "`".repeat(longest + 1);
  const pad = flat.startsWith("`") || flat.endsWith("`") ? " " : "";
  return escapePipes(`${ticks}${pad}${flat}${pad}${ticks}`);
}

/**
 * One props table. Reads the fields as Nextra's TSDoc component does: the default from
 * `@default` or `@defaultValue`, the description from the comment or `@description`, plus
 * `@deprecated`. A required prop with no default says `required`.
 */
export function renderTable(entries: TypeField[]) {
  const rows = entries.map((entry) => {
    const tags = entry.tags ?? {};
    const fallback = tags.default || tags.defaultValue;
    const deprecated = tags.deprecated;
    const description = [
      entry.description || tags.description,
      deprecated !== undefined && `Deprecated${deprecated ? `: ${deprecated}` : "."}`,
    ]
      .filter(Boolean)
      .join(" ");
    const cells = [
      codeSpan(entry.name),
      codeSpan(entry.type),
      fallback ? codeSpan(fallback) : entry.optional ? "—" : "required",
      escapePipes(flatten(description)),
    ];
    return `| ${cells.join(" | ")} |`;
  });
  return ["| Prop | Type | Default | Description |", "| --- | --- | --- | --- |", ...rows];
}

function entriesOf(page: string, call: Call, generateDefinition: GenerateDefinition) {
  const at = `content/${page}:${call.line}`;
  let definition: ReturnType<GenerateDefinition>;
  try {
    definition = generateDefinition({ code: call.code });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${at} - generateDefinition failed (is chunks-ui built?): ${message}`);
  }
  if (!("entries" in definition) || definition.entries.length === 0) {
    throw new Error(
      `${at} - generateDefinition returned no props table (a function signature or an empty type), which generate-props.ts does not render`,
    );
  }
  return definition.entries;
}

/** The props file of one page (`page` is its path in `content/`), or `null` if it has no calls */
export function propsMarkdown(
  page: string,
  source: string,
  generateDefinition: GenerateDefinition,
) {
  const { title, sections } = extractBlocks(page, source);
  if (sections.length === 0) return null;
  if (title === undefined) throw new Error(`content/${page} - no "# " heading to title its props`);
  const lines = [
    `<!-- Generated by apps/docs/scripts/generate-props.ts from apps/docs/content/${page}. Do not edit: run \`${FIX}\`. -->`,
    "",
    `# ${title} props`,
  ];
  for (const { heading, calls } of sections) {
    lines.push("", `## ${heading}`);
    for (const call of calls) {
      lines.push("", ...renderTable(entriesOf(page, call, generateDefinition)));
    }
  }
  return `${lines.join("\n")}\n`;
}

type Drift = { path: string; problem: "changed" | "missing" | "extra" };

/** Compares the generated files with those on disk, both keyed by their path in `props/` */
export function diffOutputs(generated: Map<string, string>, onDisk: Map<string, string>) {
  const drift: Drift[] = [];
  for (const [path, text] of generated) {
    const current = onDisk.get(path);
    if (current === undefined) drift.push({ path, problem: "missing" });
    else if (current !== text) drift.push({ path, problem: "changed" });
  }
  for (const path of onDisk.keys()) {
    if (!generated.has(path)) drift.push({ path, problem: "extra" });
  }
  return drift;
}

const PROBLEMS: Record<Drift["problem"], string> = {
  changed: "differs from the generated tables",
  missing: "missing: its page has props tables",
  extra: "extra: no page generates it",
};

async function loadGenerateDefinition(): Promise<GenerateDefinition> {
  // Nextra's ts-morph project reads ./tsconfig.json from the working directory when it loads
  process.chdir(DOCS_DIR);
  // ponytail: imports a Nextra internal, dist/server/tsdoc/base.js. The public `nextra/tsdoc`
  // entry also loads client MDX code that fails outside Next (Cannot find package
  // 'next-mdx-import-source-file'), and the exports map blocks the deep path, so the path is
  // derived from the entry. A Nextra upgrade that moves or renames base.js fails this script and
  // CI's check:props until the path is updated. Switch to `nextra/tsdoc` once it runs outside Next.
  const base: { generateDefinition?: GenerateDefinition } = await import(
    new URL("./base.js", import.meta.resolve("nextra/tsdoc")).href
  );
  if (typeof base.generateDefinition !== "function") {
    throw new Error("Nextra's tsdoc/base.js no longer exports generateDefinition");
  }
  return base.generateDefinition;
}

async function generateOutputs(generateDefinition: GenerateDefinition) {
  const outputs = new Map<string, string>();
  const errors: string[] = [];
  for (const page of [...new Bun.Glob("**/*.mdx").scanSync(CONTENT_DIR)].sort()) {
    try {
      const source = await Bun.file(join(CONTENT_DIR, page)).text();
      const markdown = propsMarkdown(page, source, generateDefinition);
      if (markdown !== null) outputs.set(page.replace(/\.mdx$/, ".md"), markdown);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { outputs, errors };
}

async function readOutputs() {
  const files = new Map<string, string>();
  if (!existsSync(PROPS_DIR)) return files;
  for (const path of new Bun.Glob("**/*.md").scanSync(PROPS_DIR)) {
    files.set(path, await Bun.file(join(PROPS_DIR, path)).text());
  }
  return files;
}

// Not on import, so the spec can test the parts
if (import.meta.main) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  if (args.some((arg) => arg !== "--check")) {
    console.error(`Unknown argument in "${args.join(" ")}". Usage: generate-props.ts [--check]`);
    process.exit(2);
  }
  const { outputs, errors } = await generateOutputs(await loadGenerateDefinition());
  for (const error of errors) console.error(error);
  if (errors.length > 0) process.exit(1);
  const drift = diffOutputs(outputs, await readOutputs());

  if (check) {
    for (const { path, problem } of drift)
      console.error(`apps/docs/props/${path} - ${PROBLEMS[problem]}`);
    if (drift.length > 0) {
      console.error(`The props tables are out of date. Run (from the repo root): ${FIX}`);
      process.exit(1);
    }
    console.log(`Checked ${outputs.size} props files: up to date.`);
  } else {
    for (const { path, problem } of drift) {
      const file = join(PROPS_DIR, path);
      if (problem === "extra") {
        await rm(file);
      } else {
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, outputs.get(path) ?? "");
      }
    }
    console.log(`Generated ${outputs.size} props files, ${drift.length} written or deleted.`);
  }
}
