"use client";

import { Button, type ButtonProps, Loader, Toast } from "chunks-ui";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Container } from "@/components";

type ToastType = Exclude<NonNullable<ButtonProps["color"]>, "secondary">;

const TYPE_STYLES = {
  primary: {
    icon: Info,
    iconClassName: "text-primary",
    className: "border-l-4 border-primary",
  },
  success: {
    icon: CheckCircle2,
    iconClassName: "text-success",
    className: "border-l-4 border-success",
  },
  destructive: {
    icon: XCircle,
    iconClassName: "text-destructive",
    className: "border-l-4 border-destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-warning",
    className: "border-l-4 border-warning",
  },
} as const satisfies Record<ToastType, { icon: unknown; iconClassName: string; className: string }>;

function ToastSetup({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider>
      {children}
      <Toast.Viewport />
    </Toast.Provider>
  );
}

interface ToastTriggerProps {
  label: string;
  title: string;
  description?: string;
  type?: ToastType;
}

function ToastTrigger({ label, title, description, type }: ToastTriggerProps) {
  const { add } = Toast.useToast();

  return (
    <Button
      type="button"
      onClick={() => add({ title, description, ...(type && TYPE_STYLES[type]) })}
      variant="outlined"
      color={type}
    >
      {label}
    </Button>
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
            type="primary"
          />
          <ToastTrigger
            label="Success"
            title="Deployment complete"
            description="Version 2.4.1 is now live."
            type="success"
          />
          <ToastTrigger
            label="Error"
            title="Build failed"
            description="Check the logs for details."
            type="destructive"
          />
          <ToastTrigger
            label="Warning"
            title="Usage at 94%"
            description="Limit reset in 5 min"
            type="warning"
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

/**
 * Fake async request used by the promise example. Resolves with a filename
 * ~80% of the time, rejects with a network error the rest.
 */
function uploadFile(): Promise<{ name: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.2) {
        resolve({ name: "report-2026-04.pdf" });
      } else {
        reject(new Error("Network timeout"));
      }
    }, 1500);
  });
}

function ToastPromiseTrigger() {
  const { promise } = Toast.useToast();

  return (
    <Button
      type="button"
      variant="outlined"
      onClick={() => {
        promise(uploadFile(), {
          loading: {
            title: "Uploading file…",
            description: "Hold tight, this will only take a moment",
            icon: Loader,
            iconClassName: "text-primary animate-spin",
            className: "border-l-4 border-primary",
          },
          success: (result) => ({
            title: "Upload complete",
            description: (
              <span className="text-xs">
                <code className="bg-muted px-1 rounded border border-border">{result.name}</code>{" "}
                saved
              </span>
            ),
            ...TYPE_STYLES.success,
          }),
          error: (err) => ({
            title: "Upload failed",
            description: err instanceof Error ? err.message : "Something went wrong.",
            ...TYPE_STYLES.destructive,
          }),
        }).catch(() => {
          /* swallow — the toast already surfaced the error to the user */
        });
      }}
    >
      Upload file
    </Button>
  );
}

export function ToastPromiseExample() {
  return (
    <Container>
      <ToastSetup>
        <ToastPromiseTrigger />
      </ToastSetup>
    </Container>
  );
}

function ToastStackingTrigger() {
  const { add } = Toast.useToast();

  return (
    <Button
      type="button"
      variant="outlined"
      onClick={() => {
        for (let i = 1; i <= 4; i++) {
          add({
            title: `Notification ${i}`,
            description: "Hover the stack to expand.",
            icon: TYPE_STYLES.primary.icon,
            iconClassName: TYPE_STYLES.primary.iconClassName,
            className: "toast-stack",
          });
        }
      }}
    >
      Show stack
    </Button>
  );
}

export function ToastStackingExample() {
  return (
    <Container>
      <Toast.Provider limit={5}>
        <ToastStackingTrigger />
        <Toast.Viewport className="toast-stack-viewport" />
      </Toast.Provider>
    </Container>
  );
}
