/**
 * Builds the Pagefind search index from prerendered HTML.
 *
 * Replaces `pagefind --site .next/server/app` because, since Next 16.3.8, builds
 * with a deployment adapter (Vercel's) write HTML to
 * `.next/server/route-cache/APP_PAGE/<hash>/$/<route>.html`, and the adapter
 * copies `public/` into `.next/output/static` before `postbuild` runs.
 */
import { existsSync } from "node:fs";
import * as pagefind from "pagefind";

const SERVER_DIR = ".next/server";
const ADAPTER_STATIC_DIR = ".next/output/static";

// Map each file to the path the old `--site .next/server/app` saw, so result URLs stay the same.
const files = new Map<string, string>();
for (const file of new Bun.Glob("{app,route-cache}/**/*.html").scanSync(SERVER_DIR)) {
  const marker = file.indexOf("/$/");
  if (file.startsWith("route-cache/") && marker === -1) {
    throw new Error(`Unrecognised route-cache path: ${file}`);
  }
  files.set(
    file.startsWith("app/") ? file.slice(4) : file.slice(marker + 3),
    `${SERVER_DIR}/${file}`,
  );
}
if (files.size === 0) throw new Error(`No prerendered HTML under ${SERVER_DIR}`);

const { index, errors } = await pagefind.createIndex();
if (!index) throw new Error(errors.join("\n"));

for (const [sourcePath, file] of files) {
  const added = await index.addHTMLFile({ sourcePath, content: await Bun.file(file).text() });
  if (added.errors.length > 0) throw new Error(added.errors.join("\n"));
}

const outputPaths = ["public/_pagefind"];
if (existsSync(ADAPTER_STATIC_DIR)) outputPaths.push(`${ADAPTER_STATIC_DIR}/_pagefind`);
for (const outputPath of outputPaths) {
  const written = await index.writeFiles({ outputPath });
  if (written.errors.length > 0) throw new Error(written.errors.join("\n"));
}

await pagefind.close();
console.log(`Pagefind: indexed ${files.size} HTML files into ${outputPaths.join(", ")}`);
