import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkPlaywrightVersions } from "../check-playwright-version";

const ROOT = join(import.meta.dirname, "../..");
const READ = ["packages/ui/package.json", "apps/docs/package.json", "TESTING_STRATEGY.md"];
const dirs: string[] = [];

/** A copy of the files the check reads, with `edit` applied to `file`. */
function copyWith(file: string, edit: (text: string) => string): string {
  const dir = mkdtempSync(join(tmpdir(), "playwright-version-"));
  dirs.push(dir);
  for (const path of [...READ, ".github/workflows"]) {
    cpSync(join(ROOT, path), join(dir, path), { recursive: true });
  }
  writeFileSync(join(dir, file), edit(readFileSync(join(dir, file), "utf8")));
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkPlaywrightVersions", () => {
  it("passes on today's files", async () => {
    expect(await checkPlaywrightVersions(ROOT)).toEqual([]);
  });

  it("names a workflow image whose tag differs", async () => {
    const dir = copyWith(".github/workflows/quality-gates.yml", (text) =>
      text.replace(/playwright:v[\d.]+-/, "playwright:v0.0.1-"),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringMatching(/^\.github\/workflows\/quality-gates\.yml:\d+ has 0\.0\.1, /),
    ]);
  });

  it("names a package.json whose version differs", async () => {
    const dir = copyWith("apps/docs/package.json", (text) =>
      text.replace(/"playwright": "[^"]+"/, '"playwright": "^0.0.1"'),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringMatching(/^apps\/docs\/package\.json \(playwright\) has \^0\.0\.1, /),
    ]);
  });

  it("fails when the TESTING_STRATEGY.md recipe names no image tag", async () => {
    const dir = copyWith("TESTING_STRATEGY.md", (text) =>
      text.replaceAll(/playwright:v[\d.]+-noble/g, "playwright"),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringContaining("TESTING_STRATEGY.md names no"),
    ]);
  });
});
