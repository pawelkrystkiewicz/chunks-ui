"use client";

import { Toast } from "chunks-ui";
import { Container } from "@/components";

function ToastSetup({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider>
      {children}
      <Toast.Viewport />
    </Toast.Provider>
  );
}

function ToastTrigger({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  const { add } = Toast.useToast();

  return (
    <button
      type="button"
      onClick={() => add({ title, description })}
      className="micro-interactions inline-flex h-9 items-center rounded-md border border-border bg-background px-4 font-medium text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      {label}
    </button>
  );
}

export function ToastBasicExample() {
  return (
    <Container>
      <ToastSetup>
        <ToastTrigger
          label="Show toast"
          title="File saved"
          description="Your changes have been saved."
        />
      </ToastSetup>
    </Container>
  );
}

export function ToastVariantsExample() {
  return (
    <Container>
      <ToastSetup>
        <div className="flex flex-wrap gap-2">
          <ToastTrigger
            label="Info"
            title="Build started"
            description="Deploying to production..."
          />
          <ToastTrigger
            label="Success"
            title="Deployment complete"
            description="Version 2.4.1 is now live."
          />
          <ToastTrigger
            label="Error"
            title="Build failed"
            description="Check the logs for details."
          />
        </div>
      </ToastSetup>
    </Container>
  );
}

function ToastWithActionTrigger() {
  const { add } = Toast.useToast();

  return (
    <button
      type="button"
      onClick={() =>
        add({
          title: "Message deleted",
          description: "The message has been removed from your inbox.",
          actionProps: {
            children: "Undo",
            onClick: () => console.log("Undo triggered"),
          },
        })
      }
      className="micro-interactions inline-flex h-9 items-center rounded-md border border-border bg-background px-4 font-medium text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      Delete message
    </button>
  );
}

export function ToastWithActionExample() {
  return (
    <Container>
      <Toast.Provider>
        <ToastWithActionTrigger />
        <Toast.Viewport />
      </Toast.Provider>
    </Container>
  );
}
