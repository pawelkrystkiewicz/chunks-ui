import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { ThemeToggle } from "./index";

describe("ThemeToggle", () => {
  it("light theme", async () => {
    const { fixture } = await renderFixture(<ThemeToggle theme="light" onThemeChange={() => {}} />);
    await expect(fixture).toMatchScreenshot();
  });

  it("dark theme", async () => {
    const { fixture } = await renderFixture(<ThemeToggle theme="dark" onThemeChange={() => {}} />);
    await expect(fixture).toMatchScreenshot();
  });
});
