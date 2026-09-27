import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TURNTABLE_MODELS, turntableForKit } from "./models";

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

const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

describe("turntableForKit", () => {
  it("gives the Kit 72h its 30 L backpack and every other kit nothing", () => {
    expect(turntableForKit("kit-72h")).toBe("mochila-30l");
    expect(turntableForKit("kit-24h")).toBeNull();
    expect(turntableForKit("kit-custom")).toBeNull();
    expect(turntableForKit("constructor")).toBeNull();
  });
});

describe.each(Object.entries(TURNTABLE_MODELS))("model %s", (_, model) => {
  it("ships a power-of-two texture, which WebGL 1 needs to mipmap and wrap it", () => {
    const [width, height] = webpSize(model.texture);
    expect(isPowerOfTwo(width) && isPowerOfTwo(height)).toBe(true);
  });

  it("declares its poster's real size", () => {
    expect(webpSize(model.poster.src)).toEqual([model.poster.width, model.poster.height]);
  });
});
