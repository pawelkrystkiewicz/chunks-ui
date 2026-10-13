import { useEffect } from "react";
import { Toast } from "./index";

/** Adds `count` dismissible toasts titled "Toast 1" to "Toast N" that stay until closed */
export function AddToasts({ count, className }: { count: number; className?: string }) {
  const manager = Toast.useToast();
  // Fixed ids: if the component mounts again (<Activity> showing it, a remount), the effect adds
  // the same ids, which updates the toasts instead of adding duplicates. (StrictMode's second run
  // is not the reason: a ref guard would cover that.) The effect runs on mount only: `useToast()`
  // returns a new `manager` on every render, and updating a toast renders again.
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
