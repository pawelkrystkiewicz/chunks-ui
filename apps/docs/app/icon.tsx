import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    <svg
      width={size.width}
      height={size.height}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Chunks UI"
    >
      <circle cx="150" cy="150" r="150" fill="white" />
      <rect x="86" y="88" width="128.507" height="128.507" rx="3" fill="black" />
      <rect
        x="223.688"
        y="134.972"
        width="15.0663"
        height="132.052"
        transform="rotate(45 223.688 134.972)"
        fill="white"
      />
    </svg>,
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    },
  );
}
