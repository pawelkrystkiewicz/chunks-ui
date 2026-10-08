import { Button, Checkbox, Field, Input, Separator } from "chunks-ui";
import { Github } from "lucide-react";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

export function SignInCard() {
  return (
    <PreviewCard className="gap-6">
      <PreviewCardHeading title="Sign in" description="Welcome back to Acme." />
      <div className="flex flex-col gap-4">
        <Field.Root className="gap-2">
          <Field.Label>Email</Field.Label>
          <Input type="email" defaultValue="alice@acme.dev" />
        </Field.Root>
        <Field.Root className="gap-2">
          <div className="flex items-center justify-between">
            <Field.Label>Password</Field.Label>
            <button type="button" className="font-medium text-primary text-xs hover:underline">
              Forgot?
            </button>
          </div>
          <Input type="password" defaultValue="hunter2hunter" />
        </Field.Root>
        <div className="flex items-center gap-2 text-sm">
          <Checkbox.Root id="remember" defaultChecked>
            <Checkbox.Indicator />
          </Checkbox.Root>
          <label htmlFor="remember">Keep me signed in</label>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Button className="w-full">Sign in</Button>
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <Separator className="flex-1" />
          or
          <Separator className="flex-1" />
        </div>
        <Button
          variant="outlined"
          color="secondary"
          className="w-full"
          startIcon={<Github className="size-4" />}
        >
          Continue with GitHub
        </Button>
      </div>
    </PreviewCard>
  );
}
