import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkPlaywrightVersions } from "../check-playwright-version";

const ROOT = join(import.meta.dirname, "../..");
const READ = ["packages/ui/package.json", "apps/docs/package.json", "TESTING_STRATEGY.md"];
const dirs: string[] = [];

/** A copy of the files the check reads. */
function copyRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), "playwright-version-"));
  dirs.push(dir);
  for (const path of [...READ, ".github/workflows"]) {
    cpSync(join(ROOT, path), join(dir, path), { recursive: true });
  }
  return dir;
}

/** A copy of the files the check reads, with `edit` applied to `file`. */
function copyWith(file: string, edit: (text: string) => string): string {
  const dir = copyRoot();
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
    expect(await checkPlaywrightVersions(dir)).toEqual(
      expect.arrayContaining([expect.stringContaining("TESTING_STRATEGY.md names no")]),
    );
  });

  it("fails on the recipe's docker command when it names the image by digest only", async () => {
    const dir = copyWith("TESTING_STRATEGY.md", (text) =>
      text.replace(/(docker run .*playwright):v[\d.]+-noble@/, "$1@"),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringMatching(/^TESTING_STRATEGY\.md:\d+ .*no v<version> tag/),
    ]);
  });

  it("fails on a workflow image without a version tag", async () => {
    const dir = copyWith(".github/workflows/quality-gates.yml", (text) =>
      text.replace(/playwright:v[\d.]+-noble@/, "playwright:latest@"),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringMatching(/^\.github\/workflows\/quality-gates\.yml:\d+ .*no v<version> tag/),
    ]);
  });

  it("fails on a workflow image named by digest only", async () => {
    const dir = copyWith(".github/workflows/update-screenshots.yml", (text) =>
      text.replace(/playwright:v[\d.]+-noble@/, "playwright@"),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringMatching(
        /^\.github\/workflows\/update-screenshots\.yml:\d+ .*no v<version> tag/,
      ),
    ]);
  });

  it("fails when no workflow names a Playwright image", async () => {
    const dir = copyRoot();
    for (const file of readdirSync(join(dir, ".github/workflows"))) {
      const path = join(dir, ".github/workflows", file);
      writeFileSync(
        path,
        readFileSync(path, "utf8").replaceAll("mcr.microsoft.com/playwright", "example.com/other"),
      );
    }
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringContaining("workflows name no mcr.microsoft.com/playwright"),
    ]);
  });

  it("fails when the workflows pin different digests", async () => {
    const dir = copyWith(".github/workflows/quality-gates.yml", (text) =>
      text.replace(/@sha256:[0-9a-f]{64}/, `@sha256:${"0".repeat(64)}`),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual(
      expect.arrayContaining([expect.stringMatching(/digest .*differs/)]),
    );
  });

  it("fails when the recipe cites another digest than the workflows", async () => {
    const dir = copyWith("TESTING_STRATEGY.md", (text) =>
      text.replace(/(v[\d.]+-noble@sha256:)[0-9a-f]{8}…/, "$1deadbeef…"),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringMatching(/cites sha256:deadbeef/),
    ]);
  });

  it("fails when the workflows pin a digest and the recipe cites none", async () => {
    const dir = copyWith("TESTING_STRATEGY.md", (text) =>
      text.replaceAll(/@sha256:[0-9a-f]{6,63}…/g, ""),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringMatching(/TESTING_STRATEGY\.md cites no digest/),
    ]);
  });

  it("accepts a bare tag followed by a digest when the version matches", async () => {
    const dir = copyWith("TESTING_STRATEGY.md", (text) =>
      text.replace(/(docker run .*playwright:v[\d.]+)-noble@/, "$1@"),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([]);
  });

  it("names a bare tag whose version differs", async () => {
    const dir = copyWith("TESTING_STRATEGY.md", (text) =>
      text.replace(/(docker run .*playwright:)v[\d.]+-noble@/, "$1v0.0.1@"),
    );
    expect(await checkPlaywrightVersions(dir)).toEqual([
      expect.stringMatching(/^TESTING_STRATEGY\.md:\d+ has 0\.0\.1, /),
    ]);
  });
});
