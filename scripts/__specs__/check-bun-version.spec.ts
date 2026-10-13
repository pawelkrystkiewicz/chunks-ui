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
    const dir = copyWith("TESTING_STRATEGY.md", (text) => text.replace(/bun@[\d.]+/, "bun@0.0.1"));
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
      expect.stringMatching(/^\.github\/workflows\/unit\.tests\.yml:\d+ has 0\.0\.1, /),
    ]);
  });

  it("fails on a workflow that reads the bun version from another file", async () => {
    const dir = copyWith(".github/workflows/unit.tests.yml", (text) =>
      text.replace("bun-version-file: package.json", "bun-version-file: .bun-version"),
    );
    expect(await checkBunVersions(dir)).toEqual([
      expect.stringMatching(/^\.github\/workflows\/unit\.tests\.yml:\d+ reads \.bun-version, /),
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
});
