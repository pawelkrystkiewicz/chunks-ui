import { render, screen } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { describe, it } from "vitest";
import { page } from "vitest/browser";
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
