import { ImageResponse } from "next/og";
import { PIXEL_CUT_PATH, SMALL_CUT_PATH } from "./favicon-paths";

// One PNG per cut: the pixel cut stays sharp at 16 px, the small cut is drawn for 32 px
const ICONS = [
  { id: "16", px: 16, path: PIXEL_CUT_PATH },
  { id: "32", px: 32, path: SMALL_CUT_PATH },
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
  const { px, path } = ICONS.find((icon) => icon.id === iconId) ?? ICONS[1];
  return new ImageResponse(
    <svg
      width={px}
      height={px}
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Chunks UI"
    >
      <circle cx="128" cy="128" r="128" fill="white" />
      <path fill="black" fillRule="evenodd" d={path} />
    </svg>,
    { width: px, height: px },
  );
}
