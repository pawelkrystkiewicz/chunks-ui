/// <reference types="@types/bun" />
/**
 * Generates llms.txt and llms-full.txt (https://llmstxt.org) from docs MDX content.
 * Also writes llm.txt and llm-full.txt, the names the site used first, so old links keep working.
 * Run: bun run apps/docs/scripts/generate-llm-txt.ts
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const DOCS_DIR = join(import.meta.dirname, "..");
const CONTENT_DIR = join(DOCS_DIR, "content");
const COMPONENTS_DIR = join(CONTENT_DIR, "components");
const OUTPUT_DIR = join(DOCS_DIR, "public");

export const INDEX_FILE = "llms.txt";
export const FULL_FILE = "llms-full.txt";
const LEGACY_INDEX_FILE = "llm.txt";
const LEGACY_FULL_FILE = "llm-full.txt";

const VERCEL_HOST =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "chunks-ui.vercel.app";
const SITE_URL = `https://${VERCEL_HOST}`;

// ---------------------------------------------------------------------------
// MDX → plain markdown
// ---------------------------------------------------------------------------

/** Strip JSX import lines, JSX component tags, and clean up for plain markdown.
 *  Preserves content inside fenced code blocks. */
function mdxToMarkdown(raw: string): string {
  // Protect fenced code blocks from transformations
  const codeBlocks: string[] = [];
  const withPlaceholders = raw.replace(/^```[\s\S]*?^```/gm, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  const cleaned = withPlaceholders
    // Remove import statements (only outside code blocks now)
    .replace(/^import\s+.*$/gm, "")
    // Remove self-closing JSX tags like <DialogBasicExample />
    .replace(/^<\w[\w.]*\s*\/>\s*$/gm, "")
    // Remove JSX wrapper tags like <Container> ... </Container>
    .replace(/<Container[\s>].*?<\/Container>/gs, "")
    // Remove remaining JSX block tags (opening + closing on own lines)
    .replace(/^<\/?\w[\w.]*\s*\/?>.*$/gm, "")
    // Collapse 3+ blank lines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Restore code blocks
  return cleaned.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => codeBlocks[Number(i)] ?? "");
}

/** Extract first heading (# Title) from markdown */
function extractTitle(md: string): string {
  const match = md.match(/^#\s+(.+)$/m);
  return match?.[1] ?? "Untitled";
}

/** Extract first paragraph after the heading as description */
function extractDescription(md: string): string {
  const match = md.match(/^#\s+.+\n+([^#\n].+)/m);
  return match?.[1]?.trim() ?? "";
}

// ---------------------------------------------------------------------------
// Read content
// ---------------------------------------------------------------------------

interface Page {
  slug: string;
  title: string;
  description: string;
  markdown: string;
}

async function readMdxFile(filePath: string): Promise<Page> {
  const raw = await readFile(filePath, "utf-8");
  const md = mdxToMarkdown(raw);
  const slug = basename(filePath, ".mdx");
  return {
    slug,
    title: extractTitle(md),
    description: extractDescription(md),
    markdown: md,
  };
}

async function readComponentDocs(): Promise<Page[]> {
  const files = await readdir(COMPONENTS_DIR);
  const mdxFiles = files.filter((f: string) => f.endsWith(".mdx")).sort();
  return Promise.all(mdxFiles.map((f: string) => readMdxFile(join(COMPONENTS_DIR, f))));
}

async function readTopLevelPages(): Promise<Page[]> {
  const pages: Page[] = [];
  for (const name of ["getting-started.mdx", "theme.mdx", "utilities.mdx"]) {
    try {
      pages.push(await readMdxFile(join(CONTENT_DIR, name)));
    } catch {
      // skip if missing
    }
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Generate llms.txt (concise index)
// ---------------------------------------------------------------------------

function generateIndex(topPages: Page[], components: Page[]): string {
  const lines: string[] = [
    "# chunks-ui",
    "",
    "> React 19+ component library built on Base UI, Tailwind CSS v4, and Motion. Single npm package replacing @creation-ui/react.",
    "",
    "## Install",
    "",
    "```bash",
    "bun add chunks-ui motion",
    "```",
    "",
    "## Docs",
    "",
  ];

  for (const page of topPages) {
    lines.push(`- [${page.title}](${SITE_URL}/${page.slug})`);
  }

  lines.push("", "## Components", "");

  for (const comp of components) {
    const desc = comp.description ? `: ${comp.description}` : "";
    lines.push(`- [${comp.title}](${SITE_URL}/components/${comp.slug})${desc}`);
  }

  lines.push("", "## Optional", "", `- [Full documentation](${SITE_URL}/${FULL_FILE})`, "");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Generate llms-full.txt (comprehensive)
// ---------------------------------------------------------------------------

function generateFull(topPages: Page[], components: Page[]): string {
  const sections: string[] = [
    "# chunks-ui — Full Documentation",
    "",
    "> React 19+ component library built on Base UI, Tailwind CSS v4, and Motion.",
    "",
    "---",
    "",
  ];

  for (const page of topPages) {
    sections.push(page.markdown, "", "---", "");
  }

  sections.push("# Components", "", "---", "");

  for (const comp of components) {
    sections.push(comp.markdown, "", "---", "");
  }

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** Writes the index and the full docs, each under its llmstxt.org name and its legacy name. */
export async function generateLlmFiles(outputDir = OUTPUT_DIR) {
  await mkdir(outputDir, { recursive: true });

  const [topPages, components] = await Promise.all([readTopLevelPages(), readComponentDocs()]);

  const index = generateIndex(topPages, components);
  const full = generateFull(topPages, components);

  await Promise.all([
    ...[INDEX_FILE, LEGACY_INDEX_FILE].map((name) => writeFile(join(outputDir, name), index)),
    ...[FULL_FILE, LEGACY_FULL_FILE].map((name) => writeFile(join(outputDir, name), full)),
  ]);

  return { index, full };
}

if (import.meta.main) {
  generateLlmFiles()
    .then(({ index, full }) =>
      console.log(
        `Generated ${INDEX_FILE} (${index.length} bytes) and ${FULL_FILE} (${full.length} bytes), plus ${LEGACY_INDEX_FILE} and ${LEGACY_FULL_FILE}`,
      ),
    )
    .catch((err) => {
      console.error(`Failed to generate ${INDEX_FILE}:`, err);
      process.exit(1);
    });
}
