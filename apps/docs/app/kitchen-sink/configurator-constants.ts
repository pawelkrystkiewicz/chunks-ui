export interface ThemeConfig {
  bodyFont: string;
  headingFont: string;
  radius: number;
  fontSize: number;
  spacing: number;
  componentHeight: number;
}

export const DEFAULT_CONFIG: ThemeConfig = {
  bodyFont: "Manrope",
  headingFont: "Manrope",
  radius: 10,
  fontSize: 16,
  spacing: 4,
  componentHeight: 35,
};

export const BODY_FONTS = [
  "Manrope",
  "Inter",
  "DM Sans",
  "Plus Jakarta Sans",
  "Geist",
  "IBM Plex Sans",
  "Nunito Sans",
  "Source Sans 3",
] as const;

export const HEADING_FONTS = [
  "Manrope",
  "Instrument Serif",
  "Playfair Display",
  "Space Grotesk",
  "Sora",
  "Bricolage Grotesque",
] as const;

export const RADIUS_PRESETS = [
  { label: "0", value: 0 },
  { label: "4", value: 4 },
  { label: "8", value: 8 },
  { label: "10", value: 10 },
  { label: "12", value: 12 },
  { label: "16", value: 16 },
] as const;

export const PRELOADED_FONTS = new Set(["Manrope", "Fira Code", "Instrument Serif"]);

export const CSS_VARS = ["--radius", "--font-sans", "--spacing", "--spacing-ui-height"] as const;
