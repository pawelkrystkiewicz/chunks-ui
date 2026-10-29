import { Skeleton } from "chunks-ui";
import { mount } from "./_shared";

mount(
  <>
    <div className="my-3 rounded-lg bg-card p-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
    <div className="my-3 rounded-lg bg-card p-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-[180px]" />
          <Skeleton className="h-3 w-[120px]" />
        </div>
      </div>
    </div>
  </>,
  { row: true },
);
