#!/usr/bin/env bun
/**
 * Builds the files of the Chunks UI design system (a claude.ai Design System artifact) from this
 * checkout: tokens.json from theme.css, the live component bundle on React 19, the previews' stylesheet,
 * one preview and one guidelines page per component, the fonts and the logos. It publishes nothing:
 * merge.ts compares the result with the published system, and README.md says who publishes.
 *
 * Needs packages/ui/dist: run it as `bun run design-system`, which builds the package first.
 * Output: .design-system/out/ (project/ = the system's files, uploads/ = logos, sync.json, and
 * merge.mts, a copy of merge.ts, so the release's tarball merges without a checkout).
 *
 * ponytail: nothing validates the output against the Design System format, which still changes;
 * README.md, Known limits.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fromDocs, globals, REACT_GLOBALS, UI_GLOBALS } from "./lib/plugins";
import { readmeFromMdx } from "./lib/readmes";
import { type Base, buildTokens, themeForPreviews } from "./lib/tokens";

const ROOT = join(import.meta.dir, "../..");
const HERE = import.meta.dir;
const UI = join(ROOT, "packages/ui");
const DOCS = join(ROOT, "apps/docs");
const OUT = join(ROOT, ".design-system/out");
const TMP = join(ROOT, ".design-system/tmp");
const PROJECT = join(OUT, "project");
const NAMESPACE = "ChunksUI";
const DEFAULT_CARD = { group: "Other", height: 240 };

const notes: string[] = [];
/** The node_modules packages bundle() put into a script, for licenses/packages.txt. */
const bundled = new Set<string>();
const read = (path: string) => readFileSync(path, "utf8");
const write = (path: string, text: string | Uint8Array) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
const sha256 = (data: string | Uint8Array) =>
  new Bun.CryptoHasher("sha256").update(data).digest("hex");
const kebab = (name: string) => name.replace(/(?<!^)([A-Z])/g, "-$1").toLowerCase();
/** A preview inlines scripts: these would end its <script> element early. */
const inlineSafe = (js: string) =>
  js.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "\\x3C!--");

async function bundle(entry: string, plugins: Parameters<typeof Bun.build>[0]["plugins"]) {
  const result = await Bun.build({
    entrypoints: [entry],
    format: "iife",
    minify: true,
    target: "browser",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins,
    metafile: true,
  });
  const [output] = result.outputs;
  if (!result.success || !output) throw new AggregateError(result.logs, `bundling ${entry} failed`);
  // licenses/packages.txt is built from it: without it the file would silently be empty
  if (!result.metafile) throw new Error(`bundling ${entry}: Bun returned no metafile`);
  for (const input of Object.keys(result.metafile.inputs)) {
    const pkg = /^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//.exec(input)?.[1];
    if (pkg) bundled.add(resolve(pkg));
  }
  return inlineSafe(await output.text());
}

/** The components the package exports: PascalCase values exported from ./components/. */
function exportedComponents(): string[] {
  const index = read(join(UI, "src/index.ts"));
  const names = new Set<string>();
  for (const m of index.matchAll(/export \{([^}]*)\} from "\.\/components\/[^"]+";/g))
    for (const part of (m[1] ?? "").split(","))
      if (/^\s*[A-Z][a-z]\w*\s*$/.test(part)) names.add(part.trim());
  return [...names].sort();
}

async function main() {
  if (!existsSync(join(UI, "dist/index.js")))
    throw new Error("packages/ui/dist is missing: run `bun run design-system`");
  rmSync(join(ROOT, ".design-system"), { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const base: Base = JSON.parse(read(join(HERE, "tokens.base.json")));
  const cards: Record<string, { group: string; height: number }> = JSON.parse(
    read(join(HERE, "cards.json")),
  );
  const components = exportedComponents();
  // an index.ts export that no longer matches the pattern would otherwise ship an empty system
  if (components.length === 0) throw new Error("no components found in packages/ui/src/index.ts");
  for (const name of components)
    if (!cards[name])
      notes.push(`\`${name}\` is new: no entry in cards.json, shown under "${DEFAULT_CARD.group}"`);
  for (const name of Object.keys(cards))
    if (!components.includes(name))
      notes.push(`\`${name}\` is in cards.json but no longer exported`);

  // tokens.json
  const tokens = buildTokens(
    read(join(UI, "src/theme.css")),
    read(join(DOCS, "globals.css")),
    base,
    notes,
  );
  const tokenNames = new Set(
    [tokens.color, tokens.spacing, tokens.radius].flatMap((family) =>
      family.tokens.map((t) => t.name),
    ),
  );

  // React 19 ships no UMD build: two classic scripts that set window.React and window.ReactDOM
  const react = Bun.resolveSync("react", UI);
  const reactDom = dirname(Bun.resolveSync("react-dom", UI));
  const reactVersion: string = JSON.parse(read(join(dirname(react), "package.json"))).version;
  const reactDomVersion: string = JSON.parse(read(join(reactDom, "package.json"))).version;
  write(
    join(TMP, "react.js"),
    `import * as React from ${JSON.stringify(react)};\nwindow.React = React;\n`,
  );
  write(
    join(TMP, "react-dom.js"),
    `import * as D from ${JSON.stringify(join(reactDom, "index.js"))};\nimport * as C from ${JSON.stringify(join(reactDom, "client.js"))};\nwindow.ReactDOM = Object.assign({}, D, C);\n`,
  );
  const reactFile = "components/lib/react.production.min.js";
  const reactDomFile = "components/lib/react-dom.production.min.js";
  write(join(PROJECT, reactFile), await bundle(join(TMP, "react.js"), []));
  write(
    join(PROJECT, reactDomFile),
    await bundle(join(TMP, "react-dom.js"), [globals({ react: REACT_GLOBALS.react ?? "" })]),
  );
  // the index's `libraries`, in load order: merge.ts copies them into plan.json for the system's index
  const libraries = [
    { name: "react", version: reactVersion, global: "React", file: reactFile },
    { name: "react-dom", version: reactDomVersion, global: "ReactDOM", file: reactDomFile },
  ];

  // the library, Motion and Base UI included, as window.ChunksUI
  write(
    join(TMP, "bundle.js"),
    `import * as C from ${JSON.stringify(join(UI, "dist/index.js"))};\nwindow.${NAMESPACE} = Object.assign(window.${NAMESPACE} || {}, C);\n`,
  );
  const header = {
    format: 4,
    namespace: NAMESPACE,
    components: components.map((name) => ({ name })),
  };
  write(
    join(PROJECT, "components/bundle.js"),
    `/* @ds-bundle: ${JSON.stringify(header)} */\n${await bundle(join(TMP, "bundle.js"), [globals(REACT_GLOBALS)])}`,
  );
  cpSync(join(UI, "dist/index.d.ts"), join(PROJECT, "components/index.d.ts"));

  // one preview per component: previews/<Name>.tsx, else the first examples of the docs page
  const previewPlugins = [
    globals({ ...REACT_GLOBALS, ...UI_GLOBALS }),
    fromDocs(DOCS, ["lucide-react"]),
  ];
  for (const name of components) {
    // the guidelines do not depend on the preview: a component without one keeps its README
    const mdx = join(DOCS, "content/components", `${kebab(name)}.mdx`);
    if (existsSync(mdx))
      write(
        join(PROJECT, "components", name, "README.md"),
        readmeFromMdx(read(mdx), name, kebab(name)),
      );
    else notes.push(`\`${name}\` has no docs page: no guidelines`);

    let entry = join(HERE, "previews", `${name}.tsx`);
    if (!existsSync(entry)) {
      const examples = join(DOCS, "app/examples", `${name}.tsx`);
      const found = existsSync(examples)
        ? [...read(examples).matchAll(/^export function (\w+)/gm)].map((m) => m[1]).slice(0, 3)
        : [];
      if (found.length === 0) {
        notes.push(`\`${name}\` has no preview: add previews/${name}.tsx`);
        continue;
      }
      notes.push(`\`${name}\` preview made from its docs examples: ${found.join(", ")}`);
      entry = join(TMP, "previews", `${name}.tsx`);
      const shared = relative(dirname(entry), join(HERE, "previews/_shared")).replace(/\\/g, "/");
      const from = relative(dirname(entry), examples)
        .replace(/\\/g, "/")
        .replace(/\.tsx$/, "");
      write(
        entry,
        `import { mount } from "${shared}";\nimport { ${found.join(", ")} } from "${from}";\nmount(<>${found.map((f) => `<${f} />`).join("")}</>);\n`,
      );
    }
    const card = cards[name] ?? DEFAULT_CARD;
    const js = await bundle(entry, previewPlugins);
    write(
      join(PROJECT, "components", name, "preview.html"),
      `<!-- @dsCard group="${card.group}" height=${card.height} -->\n<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>${name} — preview</title></head>\n<body>\n<div id="root"></div>\n<script>\n${js}\n</script>\n</body>\n</html>\n`,
    );
  }

  // the previews' stylesheet: Tailwind over the components, the docs examples and the previews
  write(
    join(TMP, "theme.css"),
    themeForPreviews(read(join(UI, "src/theme.css")), join(UI, "src"), tokenNames),
  );
  write(
    join(TMP, "input.css"),
    [
      // source(none): only the @source paths below, not everything under the working directory
      `@import "${Bun.resolveSync("tailwindcss/index.css", UI)}" source(none);`,
      '@import "./theme.css";',
      `@source "${join(HERE, "previews")}";`,
      `@source "${join(TMP, "previews")}";`,
      `@source "${join(DOCS, "app/examples")}";`,
      `@source "${join(DOCS, "app/components/Container.tsx")}";`,
      "/* Preview frame only: the ground the components sit on, as an app sets it. */",
      "@layer base { body { background-color: var(--background); color: var(--foreground); } }",
      "",
    ].join("\n"),
  );
  const tw = Bun.spawnSync(
    [
      "bunx",
      "--bun",
      // the devDependency, never a fresh unpinned CLI from npm when the install lacks it
      "--no-install",
      "@tailwindcss/cli",
      "-i",
      join(TMP, "input.css"),
      "-o",
      join(PROJECT, "components/bundle.css"),
      "--minify",
    ],
    { cwd: ROOT, stderr: "pipe" },
  );
  if (tw.exitCode !== 0) throw new Error(`tailwindcss failed: ${tw.stderr.toString()}`);

  // hand-written pages (brand book, cover, logo notes), fonts, logos
  cpSync(join(HERE, "static"), PROJECT, { recursive: true });
  for (const [to, from] of Object.entries(base.fontFiles))
    cpSync(join(ROOT, from), join(PROJECT, to));
  const uploads: Record<string, string> = {};
  for (const [name, from] of Object.entries(base.logos)) {
    cpSync(join(ROOT, from), join(OUT, "uploads/Logos", name));
    uploads[`assets/Logos/${name}`] = sha256(readFileSync(join(ROOT, from)));
  }

  // licences, outside fonts/ and components/, which the system reads as fonts and components:
  // the fonts' OFL (§2), and the bundled packages' files, as the minifier drops their comments
  cpSync(join(DOCS, "fonts/OFL.txt"), join(PROJECT, "licenses/OFL.txt"));
  // bundle.js contains chunks-ui itself
  cpSync(join(UI, "LICENSE"), join(PROJECT, "licenses/chunks-ui.txt"));
  const licences = [...bundled].sort().map((dir) => {
    const { name, version, license } = JSON.parse(read(join(dir, "package.json")));
    const files = readdirSync(dir, { withFileTypes: true })
      .filter((f) => f.isFile() && /^(licen[cs]e|notice|copying)(?!.*\.[cm]?[jt]s$)/i.test(f.name))
      .map((f) => f.name)
      .sort();
    const text = files.map((f) => read(join(dir, f)).trim()).join("\n\n");
    return `${name}@${version} (${license})\n\n${text || "No licence file in the package."}`;
  });
  write(join(PROJECT, "licenses/packages.txt"), `${licences.join(`\n\n${"-".repeat(72)}\n\n`)}\n`);

  // hashes of everything generated: merge.ts tells an edit on the page from a change in the code
  const files: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else files[relative(PROJECT, path)] = sha256(readFileSync(path));
    }
  };
  walk(PROJECT);
  const tokenHashes: Record<string, string> = Object.fromEntries(
    [tokens.color, tokens.spacing, tokens.radius, tokens.zIndex].flatMap((family) =>
      family.tokens.map((t) => [t.name, sha256(JSON.stringify(t.value))]),
    ),
  );
  for (const [key, stack] of Object.entries(tokens.type.families))
    tokenHashes[`font-${key}`] = sha256(stack);
  const head = Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: ROOT, stderr: "pipe" });
  const commit = head.stdout.toString().trim();
  // sync.json and the report name the build by this commit: "" would pass for a real ref
  if (head.exitCode !== 0 || !commit)
    throw new Error(`git rev-parse HEAD failed: ${head.stderr.toString().trim() || "no output"}`);
  const ref = commit.slice(0, 7);
  const version: string = JSON.parse(read(join(UI, "package.json"))).version;
  const meta = {
    source: "github",
    repo: "pawelkrystkiewicz/chunks-ui",
    ref,
    commit,
    version,
    package: "packages/ui",
    paths: {
      tokens: ["packages/ui/src/theme.css", "apps/docs/globals.css"],
      fonts: Object.values(base.fontFiles),
      assets: Object.values(base.logos),
      docs: ["apps/docs/content/components/*.mdx", "scripts/design-system/static/"],
    },
    components: Object.fromEntries(
      components.map((n) => [n, `packages/ui/src/components/${kebab(n)}/`]),
    ),
    synced: new Date().toISOString().slice(0, 10),
    generated: { files: { ...files, ...uploads }, tokens: tokenHashes },
  };
  write(join(PROJECT, "tokens.json"), `${JSON.stringify({ ...tokens, meta }, null, 2)}\n`);
  write(
    join(OUT, "sync.json"),
    `${JSON.stringify({ ref, commit, version, react: reactVersion, libraries, namespace: NAMESPACE, components, notes }, null, 2)}\n`,
  );
  cpSync(join(HERE, "merge.ts"), join(OUT, "merge.mts"));
  rmSync(TMP, { recursive: true, force: true });
  console.log(
    `design system for chunks-ui@${version} (${ref}): ${components.length} components → ${relative(ROOT, OUT)}`,
  );
  for (const note of notes) console.log(`  - ${note.replace(/`/g, "")}`);
}

await main();
