import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("lets height overrides beat h-ui-height", () => {
    expect(cn("h-ui-height", "h-8")).toBe("h-8");
    expect(cn("min-h-ui-height", "min-h-24")).toBe("min-h-24");
  });

  it("treats font-heading as a font family", () => {
    expect(cn("font-heading", "text-lg", "font-semibold")).toBe(
      "font-heading text-lg font-semibold",
    );
    expect(cn("font-heading", "font-mono")).toBe("font-mono");
  });
});
