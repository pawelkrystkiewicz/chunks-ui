import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { generateLlmFiles } from "./generate-llm-txt";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "llms-txt-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const read = (name: string) => readFile(join(dir, name), "utf8");

it("writes the index to llms.txt and the full docs to llms-full.txt", async () => {
  await generateLlmFiles(dir);

  const index = await read("llms.txt");
  expect(index).toMatch(/^# chunks-ui\n/);
  expect(index).toMatch(/\/components\/button\)/);
  expect(index).toMatch(/\[Full documentation\]\(https:\/\/[^)]+\/llms-full\.txt\)/);
  const full = await read("llms-full.txt");
  expect(full).toMatch(/^# chunks-ui — Full Documentation\n/);
  expect(full).toContain("A styled button component built on Base UI's `Button` primitive.");
});

it("keeps the old llm.txt and llm-full.txt names as copies", async () => {
  await generateLlmFiles(dir);

  expect(await read("llm.txt")).toBe(await read("llms.txt"));
  expect(await read("llm-full.txt")).toBe(await read("llms-full.txt"));
});
