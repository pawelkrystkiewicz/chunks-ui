// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreviewPanel } from "./PreviewPanel";
import { DEFAULT_THEME } from "./theme-model";

it("narrows the preview's columns to 768px when Tablet is pressed", () => {
  render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
  const preview = screen.getByRole("region", { name: "Preview" });
  // The columns are the one element in the preview with an inline max-width
  const maxWidth = () => preview.querySelector<HTMLElement>("[style*='max-width']")?.style.maxWidth;
  expect(maxWidth()).toBe("100%");
  fireEvent.click(within(preview).getByRole("button", { name: "Tablet" }));
  expect(maxWidth()).toBe("768px");
});

// The preview tab lives in the URL: no spec may leave ?preview= for the next one
afterEach(() => window.history.replaceState(null, "", "/"));

describe("preview tabs", () => {
  it("shows the cards, and mounts the kitchen sink only while its tab is selected", async () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    expect(within(preview).getByRole("tab", { name: "Cards", selected: true })).toBeTruthy();
    expect(
      within(preview).queryByRole("heading", { name: "Acme Dashboard", hidden: true }),
    ).toBeNull();

    fireEvent.click(within(preview).getByRole("tab", { name: "Kitchen sink" }));
    expect(
      await within(preview).findByRole("heading", { level: 2, name: "Acme Dashboard" }),
    ).toBeTruthy();
    expect(within(preview).queryByRole("heading", { name: "Sign in", hidden: true })).toBeNull();
    expect(window.location.search).toBe("?preview=kitchen-sink");

    fireEvent.click(within(preview).getByRole("tab", { name: "Cards" }));
    await waitFor(() =>
      expect(
        within(preview).queryByRole("heading", { name: "Acme Dashboard", hidden: true }),
      ).toBeNull(),
    );
    expect(window.location.search).toBe("");
  });

  it("selects the kitchen sink from ?preview=kitchen-sink, applies the width toggle to it and keeps other params", async () => {
    window.history.replaceState(null, "", "/?preview=kitchen-sink&x=1");
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    expect(
      await within(preview).findByRole("tab", { name: "Kitchen sink", selected: true }),
    ).toBeTruthy();
    expect(within(preview).getByRole("heading", { level: 2, name: "Acme Dashboard" })).toBeTruthy();
    fireEvent.click(within(preview).getByRole("button", { name: "Mobile" }));
    expect(preview.querySelector<HTMLElement>("[style*='max-width']")?.style.maxWidth).toBe(
      "390px",
    );
    fireEvent.click(within(preview).getByRole("tab", { name: "Cards" }));
    expect(window.location.search).toBe("?x=1");
  });

  it("follows the search params on a soft navigation, both ways", async () => {
    // Next keeps the page's state when only the search params change; useSearchParams reads this context
    const panel = (params: string) => (
      <SearchParamsContext.Provider value={new URLSearchParams(params)}>
        <PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />
      </SearchParamsContext.Provider>
    );
    const { rerender } = render(panel(""));
    const preview = screen.getByRole("region", { name: "Preview" });
    expect(within(preview).getByRole("tab", { name: "Cards", selected: true })).toBeTruthy();

    window.history.replaceState(null, "", "/?preview=kitchen-sink");
    rerender(panel("preview=kitchen-sink"));
    expect(
      await within(preview).findByRole("tab", { name: "Kitchen sink", selected: true }),
    ).toBeTruthy();

    window.history.replaceState(null, "", "/");
    rerender(panel(""));
    expect(await within(preview).findByRole("tab", { name: "Cards", selected: true })).toBeTruthy();
  });

  it("keeps the breadcrumb links of the kitchen sink on the page", async () => {
    window.history.replaceState(null, "", "/?preview=kitchen-sink");
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    const link = await within(preview).findByRole("link", { name: "Projects" });
    expect(link.getAttribute("href")).toBe("#");
    expect(fireEvent.click(link)).toBe(false); // preventDefault called
  });
});

// `focus`: the role and name that receives focus on open, never the close button
const OVERLAYS = [
  { trigger: "Continue with Pro", title: "Payment details", focus: ["textbox", "Card number"] },
  { trigger: "Connect repository", title: "Connect repository", focus: ["radio", "GitHub"] },
  { trigger: "New task", title: "New task", focus: ["textbox", "Title"] },
  { trigger: "Settings", title: "Settings", focus: ["combobox", "Default view"] },
  { trigger: "More", title: "Project actions", focus: ["button", "Duplicate project"] },
] as const;

it.each(OVERLAYS)(
  "$trigger opens $title in the preview theme layer",
  async ({ trigger, title, focus: [role, name] }) => {
    render(
      <PreviewPanel theme={{ ...DEFAULT_THEME, mode: "dark", radius: 4 }} onChange={vi.fn()} />,
    );
    const preview = screen.getByRole("region", { name: "Preview" });
    const button = within(preview).getByRole("button", { name: trigger });

    fireEvent.click(button);
    const dialog = await screen.findByRole("dialog", { name: title });

    // Portaled out of the preview into the theme layer on <body>, which carries the tokens
    const layer = dialog.closest("body > div");
    expect(preview.contains(dialog)).toBe(false);
    expect(layer?.contains(preview)).toBe(false);
    expect(layer?.getAttribute("style")).toContain("--radius: 4px");
    expect(layer).toHaveProperty("className", "dark");

    const first = within(dialog).getByRole(role, { name });
    await waitFor(() => expect(document.activeElement).toBe(first));

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(button));
  },
);

// ponytail: getByRole names every button in the contrast table and the preview, so a test takes
// about 1s here and 5-6s on a CI runner, past Vitest's 5s default. Query within a row or card if
// these grow slower.
describe("while a colour editor is open", { timeout: 15_000 }, () => {
  it("outlines the preview's components that use its colour, until it closes", async () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    const lit = () => [...preview.querySelectorAll("[data-lit]")];
    fireEvent.click(within(preview).getByRole("button", { name: /^Accessibility/ }));
    expect(lit()).toEqual([]);
    // Chart 1's editor starts on its own colour; VelocityCard paints a bar series and its key with it
    fireEvent.click(screen.getByRole("button", { name: /^Edit colours: Chart 1, Light/ }));
    expect(lit().length).toBeGreaterThan(1);
    expect(lit().every((el) => el.classList.contains("bg-chart-1"))).toBe(true);
    // The editor's own swatch is in the panel, not the preview's cards: the panel is never outlined
    expect(lit().every((el) => !el.closest("table"))).toBe(true);
    fireEvent.keyDown(screen.getByRole("textbox", { name: /^Foreground colour/ }), {
      key: "Escape",
    });
    await waitFor(() => expect(lit()).toEqual([]));
  });

  it("outlines the kitchen sink's components too, when its tab is selected", async () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    fireEvent.click(within(preview).getByRole("tab", { name: "Kitchen sink" }));
    await within(preview).findByRole("heading", { level: 2, name: "Acme Dashboard" });
    fireEvent.click(within(preview).getByRole("button", { name: /^Accessibility/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Edit colours: Primary button, Light/ }));
    fireEvent.focus(screen.getByRole("textbox", { name: /^Background colour/ }));
    await waitFor(() => expect(preview.querySelectorAll("[data-lit]").length).toBeGreaterThan(0));
  });

  it("outlines the shades that follow its colour, as primary-text follows the primary", () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    fireEvent.click(within(preview).getByRole("button", { name: /^Accessibility/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Edit colours: Primary button, Light/ }));
    // The editor starts on the button's text; its background side is the primary
    fireEvent.focus(screen.getByRole("textbox", { name: /^Background colour/ }));
    // "Forgot?" paints with primary-text alone
    const forgot = within(preview).getByRole("button", { name: "Forgot?" });
    expect(forgot.hasAttribute("data-lit")).toBe(true);
  });

  it("outlines an off switch for the input colour, but not an on one, which paints the primary", () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    fireEvent.click(within(preview).getByRole("button", { name: /^Accessibility/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Edit colours: Input border, Light/ }));
    const lit = (name: string) =>
      within(preview).getByRole("switch", { name }).hasAttribute("data-lit");
    expect(lit("Weekly digest")).toBe(true);
    expect(lit("Deployments")).toBe(false);
  });

  it("outlines nothing for the other mode's colours, which the preview doesn't paint", () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const preview = screen.getByRole("region", { name: "Preview" });
    fireEvent.click(within(preview).getByRole("button", { name: /^Accessibility/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Edit colours: Chart 1, Dark/ }));
    expect(screen.getByRole("textbox", { name: /^Foreground colour/ })).toBeTruthy();
    expect(preview.querySelectorAll("[data-lit]")).toHaveLength(0);
  });
});

describe("touch targets", () => {
  it("give the preview's checkboxes, radios and switches touch-target, popups included", () => {
    const { rerender } = render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    // The scope and the popup layer on <body> both carry the theme's tokens
    const scopes = () => [...document.querySelectorAll<HTMLElement>("[style*='--radius']")];
    expect(scopes()).toHaveLength(2);
    expect(scopes().some((el) => el.className.includes("touch-target"))).toBe(false);
    rerender(<PreviewPanel theme={{ ...DEFAULT_THEME, touchTargets: true }} onChange={vi.fn()} />);
    for (const el of scopes()) expect(el.className).toContain(":touch-target");
  });
});

describe("text spacing", () => {
  it("applies WCAG 1.4.12's four overrides to the preview, popups included, while on", () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const scopes = () => [...document.querySelectorAll<HTMLElement>("[style*='--radius']")];
    const overrides = [
      "[&_*]:leading-[1.5]!",
      "[&_*]:tracking-[0.12em]!",
      "[&_*]:[word-spacing:0.16em]!",
      "[&_p]:mb-[2em]!",
    ];
    fireEvent.click(screen.getByRole("button", { name: /^Accessibility/ }));
    const toggle = screen.getByRole("switch", { name: "Override text spacing" });
    fireEvent.click(toggle);
    for (const el of scopes()) {
      for (const cls of overrides) expect(el.classList.contains(cls), cls).toBe(true);
    }
    fireEvent.click(toggle);
    for (const el of scopes()) expect(el.className).not.toContain("word-spacing");
  });

  it("says the overrides are on in the Accessibility button once the panel collapses", async () => {
    render(<PreviewPanel theme={DEFAULT_THEME} onChange={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: /^Accessibility/ });
    expect(trigger.textContent).not.toContain("Text spacing overridden");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("switch", { name: "Override text spacing" }));
    fireEvent.click(trigger);
    await waitFor(() =>
      expect(screen.queryByRole("switch", { name: "Override text spacing" })).toBeNull(),
    );
    expect(trigger.textContent).toContain("Text spacing overridden");
  });
});
