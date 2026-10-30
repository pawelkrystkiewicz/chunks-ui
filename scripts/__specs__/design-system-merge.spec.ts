import { afterEach, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const MERGE = join(import.meta.dirname, "../design-system/merge.ts");
const LIBRARIES = [
  { name: "react", version: "19.2.0", global: "React", file: "components/lib/react.js" },
  { name: "react-dom", version: "19.2.0", global: "ReactDOM", file: "components/lib/react-dom.js" },
];
const CHANGED = "Changed in the code";
const NEW = "New in the code";
const KEPT = "Edited on the page, kept";
const BOTH = "Edited on the page and changed in the code: the code's version is published";
const DELETED = "Deleted on the page, kept deleted";
const RESTORED = "Deleted on the page, restored from the code";
const GONE = "No longer in the code (kept; ask before removing)";
const README = "components/X/README.md";
const PREVIEW = "components/X/preview.html";

interface Spec {
  files: Record<string, string>;
  colors: Record<string, string>;
  /** Usage notes by colour; a colour without one is noted with its name */
  usage: Record<string, string>;
  /** type.families: the font stacks, which the merge compares */
  fonts: Record<string, string>;
  /** Stamped on the themes, shadows, font list and type styles, which the merge never compares */
  copy: string;
}
/** Changes to a Spec; null removes a file, a colour or a font stack. */
interface Edits {
  files?: Record<string, string | null>;
  colors?: Record<string, string | null>;
  usage?: Record<string, string>;
  fonts?: Record<string, string | null>;
  copy?: string;
}

/** The last published build: one prose file, one code file, two colours and two font stacks. */
const BASE: Spec = {
  files: { [README]: "guidelines v1\n", [PREVIEW]: "<p>preview v1</p>\n" },
  colors: { primary: "oklch(0.5 0.2 250)", secondary: "oklch(0.7 0.1 150)" },
  usage: {},
  fonts: { sans: '"Manrope", sans-serif', mono: '"Fira Code", monospace' },
  copy: "base",
};
/** What themes, shadows, the font list and the type styles hold in a tokens.json stamped `copy` */
const stamped = (copy: string) => ({
  themes: copy,
  shadows: copy,
  fontList: copy,
  typeStyles: copy,
});

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});
const tmp = () => {
  const dir = mkdtempSync(join(tmpdir(), "design-system-merge-"));
  dirs.push(dir);
  return dir;
};

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const mapValues = <T, U>(o: Record<string, T>, fn: (v: T) => U) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fn(v)]));
const without = (o: Record<string, string | null>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null)) as Record<string, string>;
const edit = (spec: Spec, e: Edits = {}): Spec => ({
  files: without({ ...spec.files, ...e.files }),
  colors: without({ ...spec.colors, ...e.colors }),
  usage: { ...spec.usage, ...e.usage },
  fonts: without({ ...spec.fonts, ...e.fonts }),
  copy: e.copy ?? spec.copy,
});

/**
 * Writes `spec` as a build (project/, sync.json) under `dir`. The hashes in tokens.json are
 * those of `hashed`: the page holds what was edited since, with the hashes of its last build.
 */
function write(dir: string, spec: Spec, hashed: Spec = spec, build = true) {
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  for (const [path, text] of Object.entries(spec.files)) put(`project/${path}`, text);
  const generated = {
    files: mapValues(hashed.files, sha),
    tokens: {
      ...mapValues(hashed.colors, (v) => sha(JSON.stringify(v))),
      ...Object.fromEntries(Object.entries(hashed.fonts).map(([k, v]) => [`font-${k}`, sha(v)])),
    },
  };
  const tokens = Object.entries(spec.colors).map(([name, value]) => ({
    name,
    value,
    usage: spec.usage[name] ?? name,
  }));
  put(
    "project/tokens.json",
    JSON.stringify({
      color: { themes: [{ id: spec.copy }], tokens },
      type: {
        fonts: [{ family: spec.copy }],
        families: spec.fonts,
        groups: [{ name: spec.copy }],
      },
      shadow: { tokens: [{ name: "shadow-sm", value: spec.copy }] },
      meta: { generated },
    }),
  );
  if (!build) return;
  put(
    "sync.json",
    JSON.stringify({
      ref: "abc1234",
      version: "1.2.3",
      react: "19.2.0",
      namespace: "ChunksUI",
      libraries: LIBRARIES,
    }),
  );
}

const exec = (args: string[], runtime = process.execPath, cwd?: string) => {
  const r = Bun.spawnSync([runtime, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  return { status: r.exitCode, stderr: r.stderr.toString(), stdout: r.stdout.toString() };
};

/** What a merge wrote to `out`. */
function result(out: string) {
  const text = (path: string) => readFileSync(join(out, path), "utf8");
  const sections: Record<string, string[]> = {};
  let current: string[] = [];
  for (const line of text("report.md").split("\n")) {
    if (line.startsWith("## ")) current = sections[line.slice(3)] = [];
    else if (line.startsWith("- ")) current.push(line.slice(2));
  }
  const tokens = JSON.parse(text("project/tokens.json")) as {
    color: { themes: { id: string }[]; tokens: { name: string; value: string; usage: string }[] };
    type: {
      fonts: { family: string }[];
      families: Record<string, string>;
      groups: { name: string }[];
    };
    shadow: { tokens: { value: string }[] };
  };
  return {
    out,
    plan: JSON.parse(text("plan.json")),
    report: text("report.md"),
    sections,
    colors: Object.fromEntries(tokens.color.tokens.map((t) => [t.name, t.value])),
    usage: Object.fromEntries(tokens.color.tokens.map((t) => [t.name, t.usage])),
    fonts: tokens.type.families,
    copies: {
      themes: tokens.color.themes[0]?.id,
      shadows: tokens.shadow.tokens[0]?.value,
      fontList: tokens.type.fonts[0]?.family,
      typeStyles: tokens.type.groups[0]?.name,
    },
    file: (path: string) => text(`project/${path}`),
    tree: readdirSync(join(out, "project"), { recursive: true, encoding: "utf8" })
      .filter((p) => statSync(join(out, "project", p)).isFile())
      .sort(),
  };
}

/** Merges the new build (BASE + `code`) into the published system (BASE + `page`; null = an empty folder). */
function sync({ code, page }: { code?: Edits; page?: Edits | null } = {}) {
  const root = tmp();
  const gen = join(root, "gen");
  const live = join(root, "live");
  write(gen, edit(BASE, code));
  mkdirSync(live);
  if (page !== null) write(live, edit(BASE, page), BASE, false);
  const out = join(root, "out");
  const run = exec([MERGE, "--live", live, "--gen", gen, "--out", out]);
  if (run.status !== 0) throw new Error(run.stderr);
  return { ...result(out), gen };
}

describe("a first import", () => {
  it("publishes every file and token", () => {
    const m = sync({ page: null });
    // tokens.json carries the marker of what is synced, so it goes last
    expect(m.plan.publish).toEqual([README, PREVIEW, "tokens.json"]);
    expect(m.plan.namespace).toBe("ChunksUI");
    expect(m.plan.libraries).toEqual(LIBRARIES);
    expect(m.sections[NEW]).toEqual([README, PREVIEW]);
    expect(m.tree).toEqual(["components/X/README.md", "components/X/preview.html", "tokens.json"]);
    expect(m.colors).toEqual(BASE.colors);
    expect(m.fonts).toEqual(BASE.fonts);
    expect(m.copies).toEqual(stamped("base"));
  });
});

describe("an update", () => {
  it("skips what did not change", () => {
    const m = sync();
    expect(m.plan.publish).toEqual(["tokens.json"]);
    expect(m.tree).toEqual(["tokens.json"]);
    expect(m.sections).toEqual({});
    expect(m.report).toContain("Nothing changed");
  });

  it("writes into the folder of an earlier merge, and leaves a file of its own there", () => {
    const m = sync();
    writeFileSync(join(m.out, "notes.txt"), "mine\n");
    const again = exec([MERGE, "--live", join(m.out, "../live"), "--gen", m.gen, "--out", m.out]);
    expect(again.status, again.stderr).toBe(0);
    expect(readFileSync(join(m.out, "notes.txt"), "utf8")).toBe("mine\n");
  });

  it("clears the earlier merge's files: nothing of a run with changes is left after one without", () => {
    const code = { files: { [PREVIEW]: "<p>v2</p>\n" } };
    const m = sync({ code });
    expect(m.tree).toEqual([PREVIEW, "tokens.json"]);
    // the code's change is published by now: the same build against it has nothing left to do
    const live = join(m.gen, "../published");
    write(live, edit(BASE, code), undefined, false);
    const again = exec([MERGE, "--live", live, "--gen", m.gen, "--out", m.out]);
    expect(again.status, again.stderr).toBe(0);
    expect(result(m.out).tree).toEqual(["tokens.json"]);
  });

  it("takes the build's file and token changed in the code only", () => {
    const m = sync({
      code: {
        files: { [README]: "guidelines v2\n", [PREVIEW]: "<p>v2</p>\n" },
        colors: { primary: "red" },
      },
    });
    expect(m.sections[CHANGED]).toEqual([README, PREVIEW, "token primary"]);
    expect(m.file(README)).toBe("guidelines v2\n");
    expect(m.file(PREVIEW)).toBe("<p>v2</p>\n");
    expect(m.colors).toEqual({ ...BASE.colors, primary: "red" });
  });

  it("keeps the page's file and token edited on the page only", () => {
    const m = sync({
      page: {
        files: { [README]: "mine\n", [PREVIEW]: "<p>mine</p>\n" },
        colors: { primary: "blue" },
      },
    });
    expect(m.plan.publish).toEqual(["tokens.json"]);
    expect(m.sections[KEPT]).toEqual([README, PREVIEW, "token primary"]);
    expect(m.colors).toEqual({ ...BASE.colors, primary: "blue" });
  });

  it("keeps the page's prose changed in both, and lists it", () => {
    const m = sync({
      code: { files: { [README]: "v2\n" } },
      page: { files: { [README]: "mine\n" } },
    });
    expect(m.plan.publish).toEqual(["tokens.json"]);
    expect(m.sections[KEPT]).toEqual([
      `${README} (the code's version changed too: compare by hand)`,
    ]);
  });

  it("takes the build's code file and token changed in both, and lists them", () => {
    const m = sync({
      code: { files: { [PREVIEW]: "<p>v2</p>\n" }, colors: { primary: "red" } },
      page: { files: { [PREVIEW]: "<p>mine</p>\n" }, colors: { primary: "blue" } },
    });
    expect(m.plan.publish).toEqual([PREVIEW, "tokens.json"]);
    expect(m.file(PREVIEW)).toBe("<p>v2</p>\n");
    expect(m.sections[BOTH]).toEqual([PREVIEW, "token primary"]);
    expect(m.colors.primary).toBe("red");
  });

  it("keeps prose deleted on the page deleted", () => {
    const m = sync({ page: { files: { [README]: null } } });
    expect(m.plan.publish).toEqual(["tokens.json"]);
    expect(m.sections[DELETED]).toEqual([README]);
  });

  it("restores a code file deleted on the page, in a section of its own", () => {
    const m = sync({ page: { files: { [PREVIEW]: null } } });
    expect(m.plan.publish).toEqual([PREVIEW, "tokens.json"]);
    expect(m.file(PREVIEW)).toBe("<p>preview v1</p>\n");
    expect(m.sections[RESTORED]).toEqual([PREVIEW]);
    expect(m.sections[CHANGED]).toBeUndefined();
  });

  it("lists a file and a token the code no longer has, and keeps the page's", () => {
    const m = sync({ code: { files: { [PREVIEW]: null }, colors: { secondary: null } } });
    expect(m.sections[GONE]).toEqual([PREVIEW, "token secondary"]);
    expect(m.plan.publish).toEqual(["tokens.json"]);
    expect(m.colors).toEqual(BASE.colors);
  });

  it("keeps the page's usage notes, themes, shadows, type styles and font list", () => {
    const m = sync({
      code: { colors: { primary: "red" }, usage: { primary: "the code's note" }, copy: "code" },
      page: { usage: { primary: "my note" }, copy: "mine" },
    });
    expect(m.colors.primary).toBe("red");
    expect(m.usage).toEqual({ primary: "my note", secondary: "secondary" });
    expect(m.copies).toEqual(stamped("mine"));
  });

  it("takes a font stack changed in the code only, and keeps the others", () => {
    const m = sync({ code: { fonts: { sans: '"Inter", sans-serif' } } });
    expect(m.fonts).toEqual({ ...BASE.fonts, sans: '"Inter", sans-serif' });
    expect(m.sections[CHANGED]).toEqual(["font family sans"]);
  });

  it("keeps a font stack edited on the page only", () => {
    const m = sync({ page: { fonts: { sans: "Georgia, serif" } } });
    expect(m.fonts).toEqual({ ...BASE.fonts, sans: "Georgia, serif" });
    expect(m.sections).toEqual({});
  });

  it("takes the build's font stack changed in both, and lists it", () => {
    const m = sync({
      code: { fonts: { sans: '"Inter", sans-serif' } },
      page: { fonts: { sans: "Georgia, serif" } },
    });
    expect(m.fonts.sans).toBe('"Inter", sans-serif');
    expect(m.sections[BOTH]).toEqual(["font family sans"]);
    expect(m.sections[CHANGED]).toBeUndefined();
  });

  it("keeps a token deleted on the page deleted, and publishes a token new in the code", () => {
    const m = sync({
      code: { colors: { tertiary: "green" } },
      page: { colors: { secondary: null } },
    });
    expect(Object.keys(m.colors)).toEqual(["primary", "tertiary"]);
    expect(m.colors.tertiary).toBe("green");
    expect(m.sections[DELETED]).toEqual(["token secondary"]);
    expect(m.sections[NEW]).toEqual(["token tertiary"]);
  });
});

describe("the guards", () => {
  const fixture = () => {
    const root = tmp();
    write(join(root, "gen"), BASE);
    const args = (...extra: string[]) => [MERGE, "--gen", join(root, "gen"), ...extra];
    return { root, args, out: join(root, "out") };
  };

  it("refuses a missing --live folder", () => {
    const { root, args, out } = fixture();
    for (const live of [[], ["--live", join(root, "nowhere")]]) {
      const r = exec(args(...live, "--out", out));
      expect(r.status).not.toBe(0);
      expect(r.stderr).toContain("--live");
    }
    expect(existsSync(out)).toBe(false);
  });

  it("refuses a --live folder with files but no build hashes, which is no first import", () => {
    const { root, args, out } = fixture();
    const half = join(root, "half");
    mkdirSync(join(half, "project/components/X"), { recursive: true });
    writeFileSync(join(half, "project", README), "mine\n");
    const unhashed = join(root, "unhashed");
    mkdirSync(join(unhashed, "project"), { recursive: true });
    writeFileSync(join(unhashed, "project/tokens.json"), JSON.stringify({ color: { tokens: [] } }));
    for (const live of [half, unhashed]) {
      const r = exec(args("--live", live, "--out", out));
      expect(r.status).not.toBe(0);
      expect(r.stderr).toContain("meta.generated");
    }
    expect(existsSync(out)).toBe(false);
  });

  it("refuses an --out folder that holds files but no earlier merge", () => {
    const { root, args, out } = fixture();
    mkdirSync(join(root, "live"));
    mkdirSync(out);
    writeFileSync(join(out, "notes.txt"), "mine\n");
    const r = exec(args("--live", join(root, "live"), "--out", out));
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("holds files of its own");
    expect(readFileSync(join(out, "notes.txt"), "utf8")).toBe("mine\n");
  });
});

describe("the shipped merge.mts on Node", () => {
  it("runs a first import, then reports nothing changed on the re-run", () => {
    // as in design-system.tgz: out/ holds the build and merge.mts; the merge lands next to out/
    const root = tmp();
    write(join(root, "out"), BASE);
    copyFileSync(MERGE, join(root, "out/merge.mts"));
    const empty = join(root, "empty");
    mkdirSync(empty);
    const first = exec(["out/merge.mts", "--live", empty], "node", root);
    expect(first.status, first.stderr).toBe(0);
    const m = result(join(root, "merge"));
    expect(m.plan.publish).toEqual([README, PREVIEW, "tokens.json"]);
    expect(m.plan.namespace).toBe("ChunksUI");
    expect(m.sections[NEW]).toEqual([README, PREVIEW]);

    const live = join(root, "live");
    cpSync(join(root, "merge/project"), join(live, "project"), { recursive: true });
    const again = exec(["out/merge.mts", "--live", live], "node", root);
    expect(again.status, again.stderr).toBe(0);
    expect(result(join(root, "merge")).report).toContain("Nothing changed");
  });
});
