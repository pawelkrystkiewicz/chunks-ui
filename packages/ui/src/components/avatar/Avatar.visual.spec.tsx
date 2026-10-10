import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Avatar } from "./index";

const shapes = ["circle", "rounded", "square"] as const;

const photo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#2563eb"/><circle cx="20" cy="16" r="7" fill="#fff"/><rect x="8" y="26" width="24" height="16" rx="8" fill="#fff"/></svg>',
)}`;
const missing = "/__missing_avatar__.png";

// Base UI marks the image `data-error` once it fails to load and drops `aria-hidden` once it loads
const failed = (container: HTMLElement) => container.querySelectorAll("img[data-error]").length;
const loaded = (container: HTMLElement) =>
  container.querySelectorAll("img:not([aria-hidden])").length;

describe("Avatar", () => {
  it("shapes", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {shapes.map((shape) => (
          <Avatar key={shape} fallback="AB" shape={shape} />
        ))}
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("sizes", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Avatar fallback="S" size={24} />
        <Avatar fallback="M" size={40} />
        <Avatar fallback="L" size={56} />
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("image and load-error fallback", async () => {
    const { fixture, container } = await renderFixture(
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {shapes.map((shape) => (
          <Avatar key={shape} src={photo} alt="Jane Doe" shape={shape} />
        ))}
        <Avatar src={missing} alt="Jane Doe" />
      </div>,
    );
    await expect.poll(() => failed(container)).toBe(1);
    await expect.poll(() => loaded(container)).toBe(shapes.length);
    await expect(fixture).toMatchScreenshot();
  });

  it("shows the loaded image, named once by alt", async () => {
    const { container, getAllByRole } = render(<Avatar src={photo} alt="Jane Doe" />);
    await expect.poll(() => loaded(container)).toBe(1);
    expect(container.textContent).not.toContain("JD");
    const named = getAllByRole("img", { name: "Jane Doe" });
    expect(named).toHaveLength(1);
    expect(named[0]?.tagName).toBe("IMG");
  });

  it("falls back to the initials when the image fails to load", async () => {
    const { container, getAllByRole } = render(<Avatar src={missing} alt="Jane Doe" />);
    await expect.poll(() => failed(container)).toBe(1);
    const img = container.querySelector("img") as HTMLImageElement;
    expect(getComputedStyle(img).display).toBe("none");
    const named = getAllByRole("img", { name: "Jane Doe" });
    expect(named).toHaveLength(1);
    expect(named[0]?.textContent).toBe("JD");
  });
});
