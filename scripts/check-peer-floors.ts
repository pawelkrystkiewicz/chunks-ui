#!/usr/bin/env bun
/**
 * The `floors` job in unit.tests.yml: each peer of chunks-ui at the lowest version its `^range`
 * allows. `--specs` prints `name@floor` for `bun add --no-save`; `--check` (the default) fails
 * unless every non-exempt peer resolves from packages/ui to its floor. A moved range moves the
 * floor with it. Fails on a non-caret range and on an EXEMPT name that is not a peer.
 *
 * Run: bun scripts/check-peer-floors.ts [--specs|--check]
 */
import { createRequire } from "node:module";
import { join } from "node:path";

/** Peers that are not floored, with the reason. */
export const EXEMPT: Record<string, string> = {
  "class-variance-authority": "bun.lock already holds its floor",
  tailwindcss: "check:tailwind covers it",
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

if (import.meta.main) {
  const ui = join(import.meta.dirname, "../packages/ui");
  const floors = floorsOf(
    await Bun.file(join(ui, "package.json"))
      .json()
      .then((p) => p.peerDependencies),
    EXEMPT,
  );
  if (process.argv.includes("--specs")) {
    console.log([...floors].map(([name, floor]) => `${name}@${floor}`).join(" "));
  } else {
    const require = createRequire(join(ui, "package.json"));
    let bad = false;
    for (const [name, floor] of floors) {
      const got = require(`${name}/package.json`).version;
      console.log(`${name}: resolves ${got}, floor ${floor}`);
      if (got !== floor) bad = true;
    }
    process.exit(bad ? 1 : 0);
  }
}
