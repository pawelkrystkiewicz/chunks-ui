#!/usr/bin/env bun
/**
 * Merges a fresh build (.design-system/out, from build.ts) into the published design system,
 * read back into a folder, and writes only what should be published, with a report.
 *
 *   bun scripts/design-system/merge.ts --live <folder holding the system's project/> [--gen <dir>] [--out <dir>]
 *
 * The published tokens.json carries the hashes of the last build (meta.generated). With them, each
 * file and token is one of: unchanged; changed in the code only (the new build wins); changed on the
 * page only (the page wins); changed in both (code files take the build, prose keeps the page and is
 * reported). Nothing is deleted: what the code no longer has is listed for a person to decide.
 *
 * Output in --out: project/ (the files to publish, tokens.json always), uploads.json (logos
 * to upload again), plan.json and report.md.
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
import { dirname, join, relative } from "node:path";
import { parseArgs } from "node:util";

interface Token {
  name: string;
  value: unknown;
  usage?: string;
}
interface Family {
  tokens: Token[];
  [key: string]: unknown;
}
interface Generated {
  files: Record<string, string>;
  tokens: Record<string, string>;
}
type Tokens = Record<string, unknown> & {
  type?: { families?: Record<string, string>; [key: string]: unknown };
  meta?: { generated?: Generated; [key: string]: unknown };
};

const ROOT = join(import.meta.dir, "../..");
const { values: args } = parseArgs({
  options: {
    live: { type: "string" },
    gen: { type: "string", default: join(ROOT, ".design-system/out") },
    out: { type: "string", default: join(ROOT, ".design-system/merge") },
  },
});
if (!args.live) throw new Error("--live <folder holding the published project/> is required");
const LIVE = join(args.live, "project");
const GEN = join(args.gen, "project");
const OUT = args.out;

const sha256 = (data: string | Uint8Array) =>
  new Bun.CryptoHasher("sha256").update(data).digest("hex");
const hashOf = (path: string) => (existsSync(path) ? sha256(readFileSync(path)) : undefined);
const readJson = <T>(path: string): T | undefined =>
  existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : undefined;
/** Guidelines and hand-written pages: a person's edit there is kept over the build's text. */
const isProse = (path: string) => path.endsWith(".md") || path === "components/Cover/preview.html";

const genTokens = readJson<Tokens>(join(GEN, "tokens.json"));
if (!genTokens?.meta?.generated)
  throw new Error(`no build in ${args.gen}: run \`bun run design-system\``);
const generated = genTokens.meta.generated;
const liveTokens = readJson<Tokens>(join(LIVE, "tokens.json"));
const prev: Generated = liveTokens?.meta?.generated ?? { files: {}, tokens: {} };

const publish: string[] = [];
const uploads: string[] = [];
const report: Record<string, string[]> = {
  "Changed in the code": [],
  "New in the code": [],
  "Edited on the page, kept": [],
  "Edited on the page and changed in the code: the code's version is published": [],
  "Deleted on the page, kept deleted": [],
  "No longer in the code (kept; ask before removing)": [],
};
const note = (section: string, line: string) => report[section]?.push(line);

// files
for (const [path, hash] of Object.entries(generated.files)) {
  if (path.startsWith("assets/") && !existsSync(join(GEN, path))) {
    // an upload (a logo): its bytes are in the build's uploads/
    if (prev.files[path] !== hash) {
      uploads.push(path);
      note(prev.files[path] ? "Changed in the code" : "New in the code", `${path} (upload)`);
    }
    continue;
  }
  const live = hashOf(join(LIVE, path));
  const before = prev.files[path];
  if (live === hash) continue;
  if (live === undefined) {
    if (before && isProse(path)) note("Deleted on the page, kept deleted", path);
    else {
      publish.push(path);
      note(before ? "Changed in the code" : "New in the code", path);
    }
  } else if (live === before) {
    publish.push(path);
    note("Changed in the code", path);
  } else if (before === hash) {
    note("Edited on the page, kept", path);
  } else if (isProse(path)) {
    note("Edited on the page, kept", `${path} (the code's version changed too: compare by hand)`);
  } else {
    publish.push(path);
    note("Edited on the page and changed in the code: the code's version is published", path);
  }
}
for (const path of Object.keys(prev.files))
  if (!(path in generated.files)) note("No longer in the code (kept; ask before removing)", path);

// tokens.json, token by token
const merged: Tokens = { ...(liveTokens ?? {}), ...pick(genTokens, liveTokens) };
merged.meta = genTokens.meta;
function pick(gen: Tokens, live: Tokens | undefined): Tokens {
  if (!live) return gen;
  const out: Tokens = {};
  for (const key of ["color", "spacing", "radius", "zIndex"]) {
    const g = gen[key] as Family | undefined;
    const l = live[key] as Family | undefined;
    if (!g) continue;
    if (!l) {
      out[key] = g;
      continue;
    }
    const liveByName = new Map(l.tokens.map((t) => [t.name, t]));
    const tokens: Token[] = [];
    for (const t of g.tokens) {
      const lt = liveByName.get(t.name);
      const was = prev.tokens[t.name];
      const now = generated.tokens[t.name];
      if (!lt) {
        if (was) note("Deleted on the page, kept deleted", `token ${t.name}`);
        else {
          tokens.push(t);
          note("New in the code", `token ${t.name}`);
        }
        continue;
      }
      const liveHash = sha256(JSON.stringify(lt.value));
      let value = lt.value;
      if (now !== was) {
        value = t.value;
        if (liveHash !== was && liveHash !== now)
          note(
            "Edited on the page and changed in the code: the code's version is published",
            `token ${t.name}`,
          );
        else if (liveHash !== now) note("Changed in the code", `token ${t.name}`);
      } else if (liveHash !== now) note("Edited on the page, kept", `token ${t.name}`);
      tokens.push({ ...lt, value, usage: lt.usage || t.usage });
    }
    const genNames = new Set(g.tokens.map((t) => t.name));
    for (const t of l.tokens) {
      if (genNames.has(t.name)) continue;
      tokens.push(t);
      if (prev.tokens[t.name])
        note("No longer in the code (kept; ask before removing)", `token ${t.name}`);
    }
    out[key] = { ...l, ...g, tokens, ...(l.note ? { note: l.note } : {}) };
    if (key === "color") (out[key] as Family).themes = l.themes ?? g.themes;
  }
  // type: the page's styles and fonts; font stacks follow the code where only the code changed them
  if (live.type && gen.type) {
    const families = { ...(live.type.families ?? {}) };
    for (const [k, stack] of Object.entries(gen.type.families ?? {})) {
      const id = `font-${k}`;
      if (!(k in families)) families[k] = stack;
      else if (generated.tokens[id] !== prev.tokens[id] && families[k] !== stack) {
        families[k] = stack;
        note("Changed in the code", `font family ${k}`);
      }
    }
    out.type = { ...live.type, families };
  }
  return out;
}

// output
rmSync(OUT, { recursive: true, force: true });
for (const path of publish) {
  mkdirSync(dirname(join(OUT, "project", path)), { recursive: true });
  cpSync(join(GEN, path), join(OUT, "project", path));
}
writeFileSync(join(OUT, "project/tokens.json"), `${JSON.stringify(merged, null, 2)}\n`);
const sync = readJson<{ ref: string; version: string; react: string }>(join(args.gen, "sync.json"));
const uploadFiles = uploads.map((path) => ({
  path,
  group: path.split("/")[1],
  name: path.split("/").slice(2).join("/"),
  file: join(args.gen, "uploads", path.split("/").slice(1).join("/")),
}));
const plan = {
  ref: sync?.ref,
  version: sync?.version,
  react: sync?.react,
  publish: ["tokens.json", ...publish],
  uploads: uploadFiles,
};
writeFileSync(join(OUT, "plan.json"), `${JSON.stringify(plan, null, 2)}\n`);
const lines = [`# Design system sync: chunks-ui ${sync?.version} at ${sync?.ref}`, ""];
for (const [section, items] of Object.entries(report))
  if (items.length) lines.push(`## ${section}`, "", ...items.map((i) => `- ${i}`), "");
if (lines.length === 2) lines.push("Nothing changed besides the provenance in tokens.json.");
writeFileSync(join(OUT, "report.md"), `${lines.join("\n")}\n`);
const listed = readdirSync(join(OUT, "project"), { recursive: true }).length;
console.log(
  `${publish.length + 1} files to publish, ${uploads.length} uploads → ${relative(ROOT, OUT)} (${listed} entries)`,
);
console.log(readFileSync(join(OUT, "report.md"), "utf8"));
