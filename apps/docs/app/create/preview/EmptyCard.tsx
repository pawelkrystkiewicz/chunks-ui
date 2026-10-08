import { Button, Empty } from "chunks-ui";
import { Inbox } from "lucide-react";
import { PreviewCard } from "./PreviewCard";

export function EmptyCard() {
  return (
    <PreviewCard className="border-dashed px-6 py-8 shadow-none">
      <Empty.Root className="gap-4 p-0">
        <Empty.Media className="size-[44px] rounded-full bg-muted [&>svg]:size-5">
          <Inbox />
        </Empty.Media>
        <div className="flex flex-col gap-1.5">
          <Empty.Title className="font-heading text-base">No deployments yet</Empty.Title>
          <Empty.Description className="text-balance">
            Push to main to trigger your first build.
          </Empty.Description>
        </div>
        <Button variant="outlined" color="secondary">
          Connect repository
        </Button>
      </Empty.Root>
    </PreviewCard>
  );
}
