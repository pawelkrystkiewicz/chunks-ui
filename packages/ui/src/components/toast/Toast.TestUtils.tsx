import { useEffect } from "react";
import { Toast } from "./index";

/** Adds `count` dismissible toasts titled "Toast 1" to "Toast N" that stay until closed */
export function AddToasts({ count, className }: { count: number; className?: string }) {
  const manager = Toast.useToast();
  // Fixed ids: a remount updates the toasts instead of adding duplicates. Mount-only on purpose:
  // `manager` changes every render, and updating a toast renders again.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the props are fixed in each spec
  useEffect(() => {
    for (let i = 1; i <= count; i++) {
      manager.add({
        id: `toast-${i}`,
        title: `Toast ${i}`,
        dismissible: true,
        timeout: 0,
        className,
      });
    }
  }, []);
  return null;
}
