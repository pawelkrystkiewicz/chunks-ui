import { cn } from "chunks-ui";
import type { ReactNode } from "react";

interface ContainerProps {
  children?: ReactNode;
  className?: string;
}

export const Container = ({ children, className }: ContainerProps) => {
  return (
    <div className={cn("flex gap-4 items-center py-6 mx-auto w-fit", className)}>{children}</div>
  );
};
