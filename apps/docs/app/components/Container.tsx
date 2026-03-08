"use client";
import { cn } from "chunks-ui";
import type { ReactNode } from "react";

interface ContainerProps {
  children?: ReactNode;
  className?: string;
  centered?: boolean;
}

export const Container = ({ children, className, centered = true }: ContainerProps) => {
  return (
    <div className={cn("flex items-center gap-4 py-6", centered && "mx-auto w-fit", className)}>
      {children}
    </div>
  );
};
