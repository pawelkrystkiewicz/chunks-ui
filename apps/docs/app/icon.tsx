import { ImageResponse } from "next/og";

// The paths live here, not in a module, because Next's ?<hash> on the icon URL covers only this file.
// Both are drawn in a 256 viewBox with fill-rule evenodd.
// Small cut: ring 36 units thick (outer radius 126, inner 90), drawn for 24–32 px.
// public/logo-small*.svg hold the same path.
export const SMALL_CUT_PATH =
  "M62.56 235.68A126 126 0 1 1 235.68 62.56L209.15 89.09A90 90 0 1 0 89.09 209.15ZM241.28 72.84A126 126 0 0 1 246.66 170.38L207.4 170.38A90 90 0 0 0 213.68 100.45ZM242.02 181.62A126 126 0 0 1 72.84 241.28L100.45 213.68A90 90 0 0 0 200.29 181.62ZM83 80L173 80A3 3 0 0 1 176 83L176 122.24L122.24 176L83 176A3 3 0 0 1 80 173L80 83A3 3 0 0 1 83 80ZM176 138.12L176 173A3 3 0 0 1 173 176L138.12 176L176 138.12Z";
// Pixel cut: 16 px drawing, every run on whole pixels (16 units = 1 px).
export const PIXEL_CUT_PATH =
  "M80 0H176V16H80ZM48 16H208V32H48ZM32 32H224V48H32ZM16 48H80V64H16ZM176 48H224V64H176ZM16 64H64V80H16ZM192 64H208V80H192ZM0 80H48V96H0ZM80 80H176V96H80ZM224 80H256V96H224ZM0 96H48V112H0ZM80 96H176V112H80ZM208 96H256V112H208ZM0 112H48V128H0ZM80 112H160V128H80ZM208 112H256V128H208ZM0 128H48V144H0ZM80 128H144V144H80ZM208 128H256V144H208ZM0 144H48V160H0ZM80 144H128V160H80ZM160 144H176V160H160ZM208 144H256V160H208ZM0 160H48V176H0ZM80 160H112V176H80ZM144 160H176V176H144ZM208 160H256V176H208ZM16 176H64V192H16ZM16 192H80V208H16ZM176 192H240V208H176ZM32 208H64V224H32ZM96 208H224V224H96ZM80 224H208V240H80ZM80 240H176V256H80Z";

// One PNG per cut. At 16 px the white plate is drawn without anti-aliasing too, so no pixel is half-covered.
const ICONS = [
  { id: "16", px: 16, path: PIXEL_CUT_PATH, plate: "crispEdges" },
  { id: "32", px: 32, path: SMALL_CUT_PATH, plate: "auto" },
] as const;

export function generateImageMetadata() {
  return ICONS.map(({ id, px }) => ({
    id,
    size: { width: px, height: px },
    contentType: "image/png",
  }));
}

// Next answers 404 for any other id before it calls this, so the fallback never draws
export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = String(await id);
  const { px, path, plate } = ICONS.find((icon) => icon.id === iconId) ?? ICONS[1];
  return new ImageResponse(
    <svg
      width={px}
      height={px}
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Chunks UI"
    >
      <circle cx="128" cy="128" r="128" fill="white" shapeRendering={plate} />
      <path fill="black" fillRule="evenodd" d={path} />
    </svg>,
    { width: px, height: px },
  );
}
