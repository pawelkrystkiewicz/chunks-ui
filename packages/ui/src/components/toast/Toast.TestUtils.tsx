import { useEffect, useRef } from "react";
import { Toast } from "./index";

/** Adds `count` dismissible toasts titled "Toast 1" to "Toast N" that stay until closed */
export function AddToasts({ count, className }: { count: number; className?: string }) {
  const manager = Toast.useToast();
  const added = useRef(false);
  useEffect(() => {
    if (added.current) return;
    added.current = true;
    for (let i = 1; i <= count; i++) {
      manager.add({ title: `Toast ${i}`, dismissible: true, timeout: 0, className });
    }
  }, [manager, count, className]);
  return null;
}
