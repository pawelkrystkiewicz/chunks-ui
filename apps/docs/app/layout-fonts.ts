/**
 * Families the docs layout provides (Google's latin and latin-ext subsets, not a `text=` subset),
 * with their weight ranges. They are self-hosted under these names: `@font-face` rules in
 * globals.css load them from apps/docs/fonts.
 */
export const LAYOUT_FONTS = {
  Manrope: "200..800",
  Outfit: "400..800",
  "Fira Code": "300..700",
};

/**
 * Whether the layout already provides a family, so pages need not load it from Google.
 * `Object.hasOwn`, so inherited keys such as "constructor" do not count.
 */
export const isLayoutFont = (family: string): boolean => Object.hasOwn(LAYOUT_FONTS, family);
