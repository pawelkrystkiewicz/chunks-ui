import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { expect, it } from "vitest";
import Icon, { generateImageMetadata, PIXEL_CUT_PATH, SMALL_CUT_PATH } from "./icon";

async function renderPng(id: string) {
  const response = await Icon({ id: Promise.resolve(id) });
  return Buffer.from(await response.arrayBuffer());
}

/** Width and height from the IHDR chunk: big-endian uint32 at bytes 16 and 20. */
const sizeOf = (png: Buffer) => ({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) });

/** Each pixel of an 8-bit RGBA PNG as "r,g,b,a": the IDAT chunks inflated, then each row's filter undone. */
function pixelsOf(png: Buffer) {
  // bit depth 8, colour type 6 (RGBA), no interlace
  expect([png.readUInt8(24), png.readUInt8(25), png.readUInt8(28)]).toEqual([8, 6, 0]);
  const { width, height } = sizeOf(png);
  const idat: Buffer[] = [];
  for (let at = 8; at < png.length; at += 12 + png.readUInt32BE(at)) {
    if (png.toString("latin1", at + 4, at + 8) === "IDAT") {
      idat.push(png.subarray(at + 8, at + 8 + png.readUInt32BE(at)));
    }
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const rgba = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw.readUInt8(y * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? rgba.readUInt8(y * stride + x - 4) : 0;
      const up = y > 0 ? rgba.readUInt8((y - 1) * stride + x) : 0;
      const upLeft = x >= 4 && y > 0 ? rgba.readUInt8((y - 1) * stride + x - 4) : 0;
      const p = left + up - upLeft;
      const [pa, pb, pc] = [Math.abs(p - left), Math.abs(p - up), Math.abs(p - upLeft)];
      const paeth = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      const predictor = [0, left, up, (left + up) >> 1, paeth][filter] ?? 0;
      rgba.writeUInt8((raw.readUInt8(y * (stride + 1) + 1 + x) + predictor) & 255, y * stride + x);
    }
  }
  return Array.from({ length: width * height }, (_, i) =>
    [...rgba.subarray(i * 4, i * 4 + 4)].join(","),
  );
}

it("the 16 px drawing lands on whole pixels: every number is a multiple of 16 in the 256 viewBox", () => {
  const numbers = PIXEL_CUT_PATH.match(/-?\d+(\.\d+)?/g) ?? [];
  expect(numbers.length).toBeGreaterThan(0);
  expect(numbers.filter((n) => Number(n) % 16 !== 0)).toEqual([]);
});

it("each favicon renders a PNG of the size its <link> declares: 16×16 and 32×32", async () => {
  const icons = generateImageMetadata();
  expect(icons.map(({ size }) => size.width)).toEqual([16, 32]);
  for (const { id, size, contentType } of icons) {
    expect(contentType).toBe("image/png");
    expect(sizeOf(await renderPng(id))).toEqual(size);
  }
});

it("the 16 px favicon is whole pixels only: each is clear, solid white plate or solid black mark", async () => {
  const pixels = pixelsOf(await renderPng("16")).map((rgba) =>
    rgba.endsWith(",0") ? "clear" : rgba,
  );
  expect(new Set(pixels)).toEqual(new Set(["clear", "255,255,255,255", "0,0,0,255"]));
});

it("public/logo-small*.svg draw the favicon's small cut", () => {
  for (const file of ["logo-small.svg", "logo-small-dark-mode.svg"]) {
    const svg = readFileSync(new URL(`../public/${file}`, import.meta.url), "utf8");
    expect(svg).toContain(`d="${SMALL_CUT_PATH}"`);
  }
});
