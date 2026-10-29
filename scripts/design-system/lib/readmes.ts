/**
 * A component's docs page (apps/docs/content/components/<name>.mdx) → its design-system
 * guidelines: the prose and code blocks, without imports, live demos and the generated props
 * tables, which the system reads from components/index.d.ts instead.
 */

const DOCS_URL = "https://ui-kit.chunk-creations.com";
/** A line that opens with one of these is prose (`<kbd>Enter</kbd> selects the day.`), not a demo */
const INLINE_TAGS = /^(a|abbr|b|code|em|i|kbd|mark|small|span|strong|sub|sup)$/;

/**
 * The last line of the live demo or props table that starts at lines[start], or -1 when that line is
 * prose. A demo opens with a PascalCase tag, `<>`, a lowercase block tag (`<div>`) or `{`, and ends
 * at its own closing line, so prose right after `</Container>` stays. When no closing line is found
 * it ends at the next blank line.
 */
function demoEnd(lines: string[], start: number): number {
  const first = lines[start] ?? "";
  const head = first.trim();
  const indent = first.length - first.trimStart().length;
  const tag = /^<([A-Za-z][\w.]*)?(?=[\s/>]|$)/.exec(head);
  if (head.startsWith("{")) {
    // an expression: it ends where its braces balance
    let depth = 0;
    for (let j = start; j < lines.length; j++) {
      for (const ch of lines[j] ?? "") depth += ch === "{" ? 1 : ch === "}" ? -1 : 0;
      if (depth <= 0) return j;
    }
  } else if (tag && !INLINE_TAGS.test(tag[1] ?? "")) {
    const close = `</${tag[1] ?? ""}>`;
    if (head.endsWith("/>") || head.includes(close)) return start;
    // an element over several lines closes at the same indentation as it opens; a multi-line
    // self-closing one (<TSDoc ... />) closes with a line that starts with `/>`
    for (let j = start + 1; j < lines.length; j++) {
      const line = lines[j] ?? "";
      if (line.trim() === "" || line.length - line.trimStart().length !== indent) continue;
      if (line.trimStart().startsWith(close) || line.trimStart().startsWith("/>")) return j;
    }
  } else return -1;
  let end = start;
  while (end + 1 < lines.length && (lines[end + 1] ?? "").trim() !== "") end++;
  return end;
}

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
    const end = demoEnd(lines, i);
    if (end >= 0) {
      // a JSX block (a live demo, a props table)
      i = end;
      continue;
    }
    out.push(line);
  }
  let text = out.join("\n");
  // the docs may spell the title differently ("Toggle Group"): the guidelines get one H1, the component's name
  const squash = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const h1 = /^# (.+)$/m.exec(text);
  text =
    h1 && squash(h1[1] ?? "") === squash(name)
      ? `# ${name}${text.slice(h1.index + h1[0].length)}`
      : `# ${name}\n\n${text}`;
  text = text
    .replace(/\n## Props\n+(?=## |$)/g, "\n")
    .replace(/\]\((\/[^)]*)\)/g, (_, path: string) => `](${DOCS_URL}${path})`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `${text}\n\n## Source\n\n\`packages/ui/src/components/${slug}/\` in chunks-ui; docs: ${DOCS_URL}/components/${slug}. Props: the \`${name}\` types in \`components/index.d.ts\`.\n`;
}
