import { afterEach, describe, expect, it } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkBunVersions } from "../check-bun-version";

const ROOT = join(import.meta.dirname, "../..");
const READ = ["package.json", "TESTING_STRATEGY.md", ".github/workflows"];
const dirs: string[] = [];

/** A copy of the files the check reads, with `edit` applied to `file`. */
function copyWith(file: string, edit: (text: string) => string): string {
  const dir = mkdtempSync(join(tmpdir(), "bun-version-"));
  dirs.push(dir);
  for (const path of READ) cpSync(join(ROOT, path), join(dir, path), { recursive: true });
  writeFileSync(join(dir, file), edit(readFileSync(join(dir, file), "utf8")));
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkBunVersions", () => {
  it("passes on today's files", async () => {
    expect(await checkBunVersions(ROOT)).toEqual([]);
  });

  it("names a recipe whose bun version differs", async () => {
    const dir = copyWith("TESTING_STRATEGY.md", (text) =>
      text.replace(/npm i -g bun@[\d.]+/, "npm i -g bun@0.0.1"),
    );
    expect(await checkBunVersions(dir)).toEqual([
      expect.stringMatching(
        /^TESTING_STRATEGY\.md:\d+ has 0\.0\.1, package\.json \(packageManager\) has /,
      ),
    ]);
  });

  it("fails when the recipe names no bun version", async () => {
    const dir = copyWith("TESTING_STRATEGY.md", (text) => text.replaceAll(/bun@[\d.]+/g, "bun"));
    expect(await checkBunVersions(dir)).toEqual([
      expect.stringContaining("TESTING_STRATEGY.md names no bun@<version>"),
    ]);
  });

  it("names a workflow whose bun-version differs", async () => {
    const dir = copyWith(".github/workflows/unit.tests.yml", (text) =>
      text.replace("bun-version-file: package.json", 'bun-version: "0.0.1"'),
    );
    expect(await checkBunVersions(dir)).toEqual([
      expect.stringMatching(
        /^\.github\/workflows\/unit\.tests\.yml job [\w-]+ step "Setup Bun" has 0\.0\.1, /,
      ),
    ]);
  });

  it("fails on a workflow that reads the bun version from another file", async () => {
    const dir = copyWith(".github/workflows/unit.tests.yml", (text) =>
      text.replace("bun-version-file: package.json", "bun-version-file: .bun-version"),
    );
    expect(await checkBunVersions(dir)).toEqual([
      expect.stringMatching(
        /^\.github\/workflows\/unit\.tests\.yml job [\w-]+ step "Setup Bun" reads \.bun-version, /,
      ),
    ]);
  });

  it("fails when package.json names no bun packageManager", async () => {
    const dir = copyWith("package.json", (text) =>
      text.replace(/"packageManager": "[^"]+"/, '"packageManager": "npm@10.0.0"'),
    );
    expect(await checkBunVersions(dir)).toEqual([
      expect.stringContaining("package.json names no bun@<version> packageManager"),
    ]);
  });

  it("reads a recipe version without the punctuation after it", async () => {
    const dir = copyWith("TESTING_STRATEGY.md", (text) =>
      text.replace(/bun@(\d+\.\d+\.\d+) >/, "bun@$1. >"),
    );
    expect(await checkBunVersions(dir)).toEqual([]);
  });

  it("ignores a bun@ version outside the Docker recipe", async () => {
    const dir = copyWith(
      "TESTING_STRATEGY.md",
      (text) => `${text}\nOld note: use bun@0.0.1 here.\n`,
    );
    expect(await checkBunVersions(dir)).toEqual([]);
  });

  it("finds a bun-version in an unnamed list item and in flow style", async () => {
    const item = copyWith(".github/workflows/unit.tests.yml", (text) =>
      text.replace(
        /- name: Setup Bun\n(\s+)uses: (.+)\n\s+with:\n\s+bun-version-file: package.json/,
        "- uses: $2\n$1with:\n$1  bun-version: 0.0.1",
      ),
    );
    expect(await checkBunVersions(item)).toEqual([
      expect.stringMatching(
        /^\.github\/workflows\/unit\.tests\.yml job [\w-]+ step \d+ has 0\.0\.1, /,
      ),
    ]);
    const flow = copyWith(".github/workflows/unit.tests.yml", (text) =>
      text.replace(/with:\n\s+bun-version-file: package.json/, "with: { bun-version: '0.0.2' }"),
    );
    expect(await checkBunVersions(flow)).toEqual([expect.stringMatching(/ has 0\.0\.2, /)]);
  });

  it("names a workflow that is not valid YAML and keeps checking the rest", async () => {
    const dir = copyWith(
      ".github/workflows/unit.tests.yml",
      (text) => `${text}\n  bad: [unclosed\n`,
    );
    expect(await checkBunVersions(dir)).toEqual([
      expect.stringMatching(/^\.github\/workflows\/unit\.tests\.yml: not valid YAML \(.+\)$/),
    ]);
  });

  it("skips an expression, which is not a literal pin", async () => {
    const dir = copyWith(".github/workflows/unit.tests.yml", (text) =>
      text.replace("bun-version-file: package.json", "bun-version: $" + "{{ matrix.bun }}"),
    );
    expect(await checkBunVersions(dir)).toEqual([]);
  });
});
