/**
 * A component's docs page (apps/docs/content/components/<name>.mdx) → its design-system
 * guidelines: the prose and code blocks, without imports, live demos and the generated props
 * tables, which the system reads from components/index.d.ts instead.
 */

const DOCS_URL = "https://ui-kit.chunk-creations.com";

export function readmeFromMdx(mdx: string, name: string, slug: string): string {
  const lines = mdx.split("\n");
  const out: string[] = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.startsWith("```")) {
      fence = !fence;
      out.push(line);
      continue;
    }
    if (fence) {
      out.push(line);
      continue;
    }
    if (/^(import|export) /.test(line)) {
      // a statement may run over several lines; an `export const` demo runs to the blank line
      let j = i;
      while (j < lines.length && !/from\s+['"]|['"];?\s*$/.test(lines[j] ?? "")) j++;
      if (/^export (const|function)/.test(line)) {
        j = i;
        while (j < lines.length && (lines[j] ?? "").trim() !== "") j++;
      }
      i = j;
      continue;
    }
    if (/^\s*[<{]/.test(line)) {
      // a JSX block (a live demo, a props table): skip to the next blank line
      while (i + 1 < lines.length && (lines[i + 1] ?? "").trim() !== "") i++;
      continue;
    }
    out.push(line);
  }
  let text = out.join("\n");
  const title = text.indexOf(`# ${name}`);
  text = title >= 0 ? text.slice(title) : `# ${name}\n\n${text}`;
  text = text
    .replace(/\n## Props\n+(?=## |$)/g, "\n")
    .replace(/\]\((\/[^)]*)\)/g, (_, path: string) => `](${DOCS_URL}${path})`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `${text}\n\n## Source\n\n\`packages/ui/src/components/${slug}/\` in chunks-ui; docs: ${DOCS_URL}/components/${slug}. Props: the \`${name}\` types in \`components/index.d.ts\`.\n`;
}
