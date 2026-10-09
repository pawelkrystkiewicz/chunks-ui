import { render, screen } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterAll, beforeAll, describe, expect, it, onTestFinished } from "vitest";
import { commands, page } from "vitest/browser";
import { Toast } from "./index";

function AddToast({ title, description }: { title: string; description?: string }) {
  const manager = Toast.useToast();
  const added = useRef(false);
  useEffect(() => {
    if (!added.current) {
      added.current = true;
      manager.add({ title, description });
    }
  }, [manager, title, description]);
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
        <AddToast title="Connection lost" description="Reconnecting automatically." />
        <Toast.Viewport />
      </Toast.Provider>,
    );
    await screen.findByText("Connection lost");
    await expect(page.elementLocator(document.body)).toMatchScreenshot();
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
