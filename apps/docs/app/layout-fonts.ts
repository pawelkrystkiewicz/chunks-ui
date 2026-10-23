/**
 * Families the docs layout provides (every latin and latin-ext glyph, not a subset), with their
 * weight ranges. They are self-hosted: `@font-face` rules in globals.css serve them from /fonts
 * under these names.
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
