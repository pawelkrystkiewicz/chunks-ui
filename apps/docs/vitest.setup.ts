// What jsdom lacks and the docs need. Runs before each spec's imports; node specs skip it.
if (typeof window !== "undefined") {
  // nextra-theme-docs builds an IntersectionObserver at import time
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as never;

  // ToggleGroup and the popups measure their parts
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // useReducedMotion queries media; Motion below 12.20.4 subscribes with the deprecated addListener
  window.matchMedia ??= (media) =>
    ({
      matches: false,
      media,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
    }) as never;
}
