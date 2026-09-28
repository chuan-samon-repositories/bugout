import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { KIT_PHOTO_BASE, kitCardPhoto, kitPhotoRise } from "./kitCardPhotos";

/** Width and height of a WebP file, from its RIFF header (lossy, lossless or extended). */
function webpSize(file: string): [number, number] {
  const data = readFileSync(path.join(process.cwd(), "public", file));
  expect(data.toString("ascii", 0, 4)).toBe("RIFF");
  expect(data.toString("ascii", 8, 12)).toBe("WEBP");
  const chunk = data.toString("ascii", 12, 16);
  if (chunk === "VP8X") return [data.readUIntLE(24, 3) + 1, data.readUIntLE(27, 3) + 1];
  if (chunk === "VP8L") {
    const bits = data.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  expect(chunk).toBe("VP8 ");
  return [data.readUInt16LE(26) & 0x3fff, data.readUInt16LE(28) & 0x3fff];
}

describe("kitCardPhoto", () => {
  it("gives the Kit 24h and the Kit 72h their backpacks and every other kit nothing", () => {
    expect(kitCardPhoto("kit-24h")?.image.src).toBe("/images/kit-cards/kit-24h.webp");
    expect(kitCardPhoto("kit-72h")?.image.src).toBe("/images/kit-cards/kit-72h.webp");
    expect(kitCardPhoto("kit-custom")).toBeNull();
    expect(kitCardPhoto("constructor")).toBeNull();
  });

  it.each(["kit-24h", "kit-72h"])("declares the real size of the %s photo", (slug) => {
    const { image } = kitCardPhoto(slug)!;
    expect(webpSize(image.src)).toEqual([image.width, image.height]);
  });

  it("draws the Kit 72h's 65 L backpack taller than the Kit 24h's 30 L one", () => {
    expect(kitCardPhoto("kit-72h")!.height).toBeGreaterThan(kitCardPhoto("kit-24h")!.height);
  });
});

describe("kitPhotoRise", () => {
  it("is how far the tallest photo sticks out above its card", () => {
    expect(kitPhotoRise(["kit-24h", "kit-72h", "kit-custom"])).toBe(kitCardPhoto("kit-72h")!.height - KIT_PHOTO_BASE);
    expect(kitPhotoRise(["kit-24h"])).toBe(kitCardPhoto("kit-24h")!.height - KIT_PHOTO_BASE);
    expect(kitPhotoRise(["kit-custom"])).toBe(0);
    expect(kitPhotoRise([])).toBe(0);
  });
});
