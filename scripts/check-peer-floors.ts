#!/usr/bin/env bun
/**
 * The `floors` job in unit.tests.yml: each peer of chunks-ui at the lowest version its `^range`
 * allows. A moved range moves the floor with it. Fails on a non-caret range and on an EXEMPT
 * name that is not a peer.
 *
 * The React types follow the runtime: `@types/react` and `@types/react-dom` are floored at the
 * `<major>.<minor>` of the `react` and `react-dom` floors (19.2.0 gives 19.2), so types from a
 * newer React cannot hide an error that a consumer on the floor would hit.
 *
 * - `--overrides` merges every floor into `overrides` of the root package.json, in place: the
 *   peers at their exact floor, the types at `<major>.<minor>.x`. Entries already there (zod)
 *   stay. A plain `bun install` then resolves every dependent of those packages at the floors,
 *   packages/ui's own devDependencies (motion, the types) included. It edits a tracked file and
 *   the install changes bun.lock: run it only in a throwaway checkout. It refuses to run unless
 *   `CI` is set (GitHub Actions sets it) or `--force` is passed.
 * - `--check` (the default) fails unless every non-exempt peer resolves from packages/ui to its
 *   floor and each types package to a `<major>.<minor>.x` patch.
 *
 * Run: bun scripts/check-peer-floors.ts [--overrides [--force]|--check]
 */
import { createRequire } from "node:module";
import { join } from "node:path";

/** Peers that are not floored, with the reason. */
export const EXEMPT: Record<string, string> = {
  "class-variance-authority": "bun.lock already holds its floor",
  tailwindcss: "check:tailwind covers it",
};

/** The types package of each runtime peer whose floor it follows. */
export const TYPES: Record<string, string> = {
  react: "@types/react",
  "react-dom": "@types/react-dom",
};

/** name -> floor, from each `^range`. Throws on another range form or a stale exempt name. */
export function floorsOf(
  peers: Record<string, string>,
  exempt: Record<string, string>,
): Map<string, string> {
  for (const name of Object.keys(exempt)) {
    if (!(name in peers)) throw new Error(`${name}: in EXEMPT, not a peer of chunks-ui: drop it`);
  }
  const floors = new Map<string, string>();
  for (const [name, range] of Object.entries(peers)) {
    if (name in exempt) continue;
    if (!range.startsWith("^")) throw new Error(`${name}: peer range ${range} is not a ^range`);
    floors.set(name, range.replace(/^\^/, ""));
  }
  return floors;
}

/** types package -> `<major>.<minor>` of its runtime peer's floor. Throws when that peer has no floor. */
export function typeFloorsOf(
  floors: Map<string, string>,
  types: Record<string, string>,
): Map<string, string> {
  const typeFloors = new Map<string, string>();
  for (const [peer, typesName] of Object.entries(types)) {
    const floor = floors.get(peer);
    if (floor === undefined) {
      throw new Error(`${peer}: no floor to derive the ${typesName} floor from`);
    }
    const majorMinor = /^(\d+\.\d+)\./.exec(floor)?.[1];
    if (majorMinor === undefined) {
      throw new Error(`${peer}: floor ${floor} is not <major>.<minor>.<patch>`);
    }
    typeFloors.set(typesName, majorMinor);
  }
  return typeFloors;
}

/**
 * `existing` with every floor added: the peers at their exact floor, the types at their
 * `<major>.<minor>.x`. A floor replaces an entry of the same name.
 */
export function overridesOf(
  existing: Record<string, string> | undefined,
  floors: Map<string, string>,
  typeFloors: Map<string, string>,
): Record<string, string> {
  return {
    ...existing,
    ...Object.fromEntries(floors),
    ...Object.fromEntries([...typeFloors].map(([name, floor]) => [name, `${floor}.x`])),
  };
}

/** Why `--overrides` must not run here, or undefined when it may: it edits tracked files. */
export function overridesRefusal(ci: string | undefined, force: boolean): string | undefined {
  if (ci || force) return undefined;
  return "--overrides edits the tracked package.json (and the install after it bun.lock): run it in CI or in a throwaway copy of the repo, or pass --force";
}

export type Verdict = { name: string; got: string; want: string; ok: boolean };

/**
 * One verdict per floored package against the version it resolves to. A peer must resolve to
 * its floor exactly; a types package to any patch of its `<major>.<minor>`.
 */
export function verdictsOf(
  floors: Map<string, string>,
  typeFloors: Map<string, string>,
  versionOf: (name: string) => string,
): Verdict[] {
  return [
    ...[...floors].map(([name, floor]) => {
      const got = versionOf(name);
      return { name, got, want: floor, ok: got === floor };
    }),
    ...[...typeFloors].map(([name, floor]) => {
      const got = versionOf(name);
      return { name, got, want: `${floor}.x`, ok: got.startsWith(`${floor}.`) };
    }),
  ];
}

if (import.meta.main) {
  const ui = join(import.meta.dirname, "../packages/ui");
  const floors = floorsOf(
    await Bun.file(join(ui, "package.json"))
      .json()
      .then((p) => p.peerDependencies),
    EXEMPT,
  );
  const typeFloors = typeFloorsOf(floors, TYPES);
  if (process.argv.includes("--overrides")) {
    const refusal = overridesRefusal(process.env.CI, process.argv.includes("--force"));
    if (refusal !== undefined) {
      console.error(refusal);
      process.exit(1);
    }
    const file = join(import.meta.dirname, "../package.json");
    const root = await Bun.file(file).json();
    root.overrides = overridesOf(root.overrides, floors, typeFloors);
    await Bun.write(file, `${JSON.stringify(root, null, 2)}\n`);
    console.log(`overrides in ${file}:\n${JSON.stringify(root.overrides, null, 2)}`);
  } else {
    const require = createRequire(join(ui, "package.json"));
    const verdicts = verdictsOf(
      floors,
      typeFloors,
      (name) => require(`${name}/package.json`).version,
    );
    for (const { name, got, want } of verdicts) {
      console.log(`${name}: resolves ${got}, floor ${want}`);
    }
    process.exit(verdicts.every((verdict) => verdict.ok) ? 0 : 1);
  }
}
