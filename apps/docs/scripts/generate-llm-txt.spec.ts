import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { generateLlmFiles } from "./generate-llm-txt";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "llms-txt-"));
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dir, { recursive: true, force: true });
});

const read = (name: string) => readFile(join(dir, name), "utf8");

it("writes the index to llms.txt and the full docs to llms-full.txt", async () => {
  await generateLlmFiles(dir);

  const index = await read("llms.txt");
  expect(index).toMatch(/^# chunks-ui\n/);
  expect(index).toMatch(/\/components\/button\)/);
  expect(index).not.toMatch(/\/components\/index\)/);
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

// The host is read when the module loads, so each case stubs the env and imports a fresh copy
const generateWithEnv = async (env: Record<string, string | undefined>) => {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  vi.resetModules();
  const { generateLlmFiles: generate } = await import("./generate-llm-txt");
  await generate(dir);
  return read("llms.txt");
};

it("falls back to the docs production host, ignoring the per-deployment VERCEL_URL", async () => {
  const index = await generateWithEnv({
    VERCEL_PROJECT_PRODUCTION_URL: undefined,
    VERCEL_URL: "chunks-ui-abc123.vercel.app",
  });

  expect(index).toContain("(https://ui-kit.chunk-creations.com/components/button)");
  expect(index).not.toMatch(/\]\(https:\/\/[^)]*vercel\.app/);
});

it("uses VERCEL_PROJECT_PRODUCTION_URL when it is set", async () => {
  const index = await generateWithEnv({ VERCEL_PROJECT_PRODUCTION_URL: "example.com" });

  expect(index).toContain("(https://example.com/components/button)");
});

it("treats an empty VERCEL_PROJECT_PRODUCTION_URL as unset", async () => {
  const index = await generateWithEnv({ VERCEL_PROJECT_PRODUCTION_URL: "" });

  expect(index).toContain("(https://ui-kit.chunk-creations.com/components/button)");
  expect(index).not.toContain("https:///");
});
