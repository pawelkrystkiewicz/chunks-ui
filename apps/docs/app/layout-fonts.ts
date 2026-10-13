/** Families the docs layout loads in full (every glyph), with their weight ranges. */
export const LAYOUT_FONTS = {
  Manrope: "200..800",
  Outfit: "400..800",
  "Fira Code": "300..700",
};

export const LAYOUT_FONTS_HREF = `https://fonts.googleapis.com/css2?${Object.entries(LAYOUT_FONTS)
  .map(([family, weights]) => `family=${family.replaceAll(" ", "+")}:wght@${weights}`)
  .join("&")}&display=swap`;
