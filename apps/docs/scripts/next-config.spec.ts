import { expect, it } from "vitest";
// @ts-expect-error: the config is plain .mjs, with no declaration file
import config from "../next.config.mjs";

it("redirects /kitchen-sink to the kitchen sink tab of /create, permanently", async () => {
  expect(await config.redirects?.()).toContainEqual({
    source: "/kitchen-sink",
    destination: "/create?preview=kitchen-sink",
    permanent: true,
  });
});
