import { describe, expect, it } from "vitest";
import { KIT_CARD_IMAGES } from "./kitCardPhotos.generated";
import { buildReliefMesh, decodeDepth, reliefPlacement, type KitCardImage } from "./photoRelief";

const bytes = (values: number[]) => btoa(String.fromCharCode(...values));

const tiny: KitCardImage = {
  src: "/tiny.webp",
  width: 200,
  height: 100,
  relief: { columns: 3, rows: 2, axis: 0.25, depthMin: -0.5, depthStep: 0.01, depth: bytes([0, 50, 100, 150, 200, 255]) },
};

describe("decodeDepth", () => {
  it("turns the bytes back into depths", () => {
    const depth = decodeDepth(tiny.relief);
    expect(Array.from(depth, (d) => Number(d.toFixed(4)))).toEqual([-0.5, 0, 0.5, 1, 1.5, 2.05]);
  });

  it("refuses depths that do not fill the grid", () => {
    expect(() => decodeDepth({ ...tiny.relief, rows: 3 })).toThrow(RangeError);
  });
});

describe("buildReliefMesh", () => {
  it("lays the grid over the photo, measured from the turning axis, with the decoded depths", () => {
    const mesh = buildReliefMesh(tiny);
    expect(mesh.positions).toHaveLength(6 * 3);
    expect(mesh.uvs).toHaveLength(6 * 2);
    expect(mesh.indices).toHaveLength(2 * 6);
    expect(Math.max(...mesh.indices)).toBe(5);
    // top-left vertex: a quarter of the width left of the axis, half a height up
    expect(Array.from(mesh.positions.slice(0, 3))).toEqual([-0.5, 0.5, -0.5]);
    expect(Array.from(mesh.uvs.slice(0, 2))).toEqual([0, 0]);
    // bottom-right vertex
    expect(mesh.positions[5 * 3]).toBeCloseTo(1.5, 6);
    expect(mesh.positions[5 * 3 + 1]).toBeCloseTo(-0.5, 6);
    expect(Array.from(mesh.uvs.slice(10, 12))).toEqual([1, 1]);
  });

  it("refuses grids the 16-bit index buffer cannot hold", () => {
    expect(() => buildReliefMesh({ ...tiny, relief: { ...tiny.relief, columns: 1 } })).toThrow(RangeError);
    expect(() => buildReliefMesh({ ...tiny, relief: { ...tiny.relief, columns: 300, rows: 300 } })).toThrow(RangeError);
  });
});

describe("reliefPlacement", () => {
  it("places the unturned photo like object-fit: contain", () => {
    // 200 × 100 photo in a 400 × 100 canvas: 100 px tall, 200 px wide, centred
    const wide = reliefPlacement(tiny, 400, 100);
    expect(wide.scale).toEqual([0.5, 2]);
    // the axis sits a quarter of the photo from its left edge: 50 px left of the centre = -0.25 in clip space
    expect(wide.axisX).toBeCloseTo(-0.25, 6);
    // 100 × 100 canvas: the width limits, 50 px tall
    expect(reliefPlacement(tiny, 100, 100).scale).toEqual([1, 1]);
  });
});

describe.each(Object.entries(KIT_CARD_IMAGES))("the %s photo", (_, image) => {
  it("has a relief that fits its grid, with a turning axis on the photo", () => {
    const depth = decodeDepth(image.relief);
    expect(depth).toHaveLength(image.relief.columns * image.relief.rows);
    expect(Math.max(...depth.map(Math.abs))).toBeLessThan(1);
    expect(image.relief.axis).toBeGreaterThan(0);
    expect(image.relief.axis).toBeLessThan(1);
    expect(() => buildReliefMesh(image)).not.toThrow();
  });
});
