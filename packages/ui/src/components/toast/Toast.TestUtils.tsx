import { useEffect } from "react";
import { Toast } from "./index";

/** Adds `count` dismissible toasts titled "Toast 1" to "Toast N" that stay until closed */
export function AddToasts({ count, className }: { count: number; className?: string }) {
  const manager = Toast.useToast();
  // Fixed ids: adding again (StrictMode's second run) updates the toasts, not adds more. On mount
  // only: `useToast()` returns a new `manager` on every render, and updating a toast renders again.
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
