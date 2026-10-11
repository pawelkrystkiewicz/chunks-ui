import { Toast as BaseToast } from "@base-ui/react/toast";
import { render, screen } from "@testing-library/react";
import { type ComponentPropsWithoutRef, useEffect, useRef } from "react";
import { afterAll, beforeAll, describe, expect, it, onTestFinished } from "vitest";
import { commands, page } from "vitest/browser";
import { Toast } from "./index";

function AddToast({
  title,
  description,
  actionProps,
}: {
  title: string;
  description?: string;
  actionProps?: ComponentPropsWithoutRef<"button">;
}) {
  const manager = Toast.useToast();
  const added = useRef(false);
  useEffect(() => {
    if (!added.current) {
      added.current = true;
      manager.add({ title, description, actionProps });
    }
  }, [manager, title, description, actionProps]);
  return null;
}

describe("Toast", () => {
  it("default", async () => {
    render(
      <Toast.Provider>
        <AddToast title="File saved" description="Your changes have been saved." />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await screen.findByText("File saved");
    await expect(page.elementLocator(document.body)).toMatchScreenshot();
  });

  it("with action", async () => {
    render(
      <Toast.Provider>
        <AddToast
          title="Connection lost"
          description="Reconnecting automatically."
          actionProps={{ children: "Retry now" }}
        />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await screen.findByRole("button", { name: "Retry now" });
    await expect(page.elementLocator(document.body)).toMatchScreenshot();
  });
});

describe.each(["ltr", "rtl"] as const)("Toast action in %s", (dir) => {
  it("is as wide as its label and sits at the content's start edge", async () => {
    document.documentElement.dir = dir;
    onTestFinished(() => document.documentElement.removeAttribute("dir"));
    render(
      <Toast.Provider>
        <AddToast
          title="Connection lost"
          description="Reconnecting automatically."
          actionProps={{ children: "Retry now" }}
        />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const action = await screen.findByRole("button", { name: "Retry now" });
    const content = action.closest(".ToastContent") as HTMLElement;

    const label = document.createRange();
    label.selectNodeContents(action);
    const style = getComputedStyle(action);
    const chrome = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"] as const;
    const fitted =
      label.getBoundingClientRect().width +
      chrome.reduce((sum, side) => sum + Number.parseFloat(style[side]), 0);

    const box = action.getBoundingClientRect();
    const area = content.getBoundingClientRect();
    expect(box.width).toBeCloseTo(fitted, 0);
    if (dir === "ltr") expect(box.left).toBeCloseTo(area.left, 0);
    else expect(box.right).toBeCloseTo(area.right, 0);
  });
});

function RootList() {
  return (
    <>
      {Toast.useToast().toasts.map((toast) => (
        <Toast.Root key={toast.id} toast={toast}>
          <Toast.Description>{toast.description}</Toast.Description>
          <Toast.Action>Undo</Toast.Action>
        </Toast.Root>
      ))}
    </>
  );
}

describe("Toast.Action placed directly in Toast.Root", () => {
  it("stays vertically centred next to multi-line text", async () => {
    render(
      <Toast.Provider>
        <AddToast
          title="Saved"
          description="A long description that wraps onto several lines so the row is clearly taller than the button."
        />
        <BaseToast.Viewport className="fixed top-4 left-4 w-[240px]">
          <RootList />
        </BaseToast.Viewport>
      </Toast.Provider>,
    );
    const action = await screen.findByRole("button", { name: "Undo" });
    const root = action.closest(".Toast") as HTMLElement;
    const box = action.getBoundingClientRect();
    const area = root.getBoundingClientRect();
    // The action's `mt-1` shifts its box 2px below the exact centre
    expect(Math.abs(box.top + box.height / 2 - (area.top + area.height / 2))).toBeLessThan(4);
  });
});

describe("Toast with motion allowed", () => {
  beforeAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  // `translate-x-full` sets the `translate` property, not `transform`
  it("slides and fades in", async () => {
    // Every transition that starts, recorded from before the toast mounts
    const runs: { target: EventTarget | null; property: string }[] = [];
    const record = (event: TransitionEvent) => {
      runs.push({ target: event.target, property: event.propertyName });
    };
    document.addEventListener("transitionrun", record, true);
    onTestFinished(() => document.removeEventListener("transitionrun", record, true));

    render(
      <Toast.Provider>
        <AddToast title="File saved" />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const toast = (await screen.findByText("File saved")).closest(".Toast");
    const transitioned = () =>
      [...new Set(runs.filter((run) => run.target === toast).map((run) => run.property))].sort();
    await expect.poll(transitioned).toEqual(expect.arrayContaining(["opacity", "translate"]));
    expect(transitioned()).toEqual(["opacity", "translate"]);
  });
});
