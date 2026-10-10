// No "use client": this is a server component, and the docs build fails if
// chunks-ui/utils stops being callable on the server.
import { buttonVariants, cn } from "chunks-ui/utils";
import { Container } from "@/components/Container";

export function UtilitiesServerExample() {
  return (
    <Container>
      <a
        href="/components/button"
        className={cn(buttonVariants({ variant: "outlined" }), "rounded-full")}
      >
        Button docs
      </a>
    </Container>
  );
}
