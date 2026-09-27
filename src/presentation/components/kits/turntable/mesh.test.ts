import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { buildTurntableMesh, superellipsePoint, viewportScale, type TurntableShape } from "./mesh";
import { TURNTABLE_MODELS } from "./models";

const box: TurntableShape = {
  exponent: 2,
  startAngle: 0,
  viewport: { width: 2, height: 4, centerY: 1 },
  rows: [
    [0, -1, 1, -0.5, 0.5],
    [1, -1, 1, -0.5, 0.5],
    [2, -0.5, 0.5, 0, 0.5],
  ],
};

describe("superellipsePoint", () => {
  it("stays on |x|^n + |z|^n = 1", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }), fc.double({ min: 2, max: 6, noNaN: true }), (t, n) => {
        const [x, z] = superellipsePoint(t, n);
        expect(Math.abs(x) ** n + Math.abs(z) ** n).toBeCloseTo(1, 9);
      }),
    );
  });

  it("starts at the right and turns toward the front", () => {
    expect(superellipsePoint(0, 2.5)).toEqual([1, 0]);
    const [x, z] = superellipsePoint(Math.PI / 2, 2.5);
    expect(x).toBeCloseTo(0, 9);
    expect(z).toBeCloseTo(1, 9);
  });
});

describe("buildTurntableMesh", () => {
  it("builds one ring per slice with a repeated seam vertex", () => {
    const mesh = buildTurntableMesh(box, 4);
    expect(mesh.positions).toHaveLength(3 * 5 * 3);
    expect(mesh.uvs).toHaveLength(3 * 5 * 2);
    expect(mesh.indices).toHaveLength(2 * 4 * 6);
    expect(Math.max(...mesh.indices)).toBe(3 * 5 - 1);
    // first vertex of the first ring: the right edge of the bottom slice, at u = 0 and the bottom of the texture
    expect(Array.from(mesh.positions.slice(0, 3))).toEqual([1, 0, 0]);
    expect(Array.from(mesh.uvs.slice(0, 2))).toEqual([0, 1]);
    // the seam vertex closes the ring at u = 1
    expect(mesh.positions[4 * 3]).toBeCloseTo(1, 6);
    expect(mesh.uvs[4 * 2]).toBe(1);
    // the top slice sits at v = 0, centred on its own middle
    const top = 2 * 5;
    expect(mesh.uvs[top * 2 + 1]).toBe(0);
    expect(Array.from(mesh.positions.slice(top * 3, top * 3 + 3))).toEqual([0.5, 2, 0.25]);
  });

  it("refuses shapes the 16-bit index buffer cannot hold", () => {
    expect(() => buildTurntableMesh({ ...box, rows: [box.rows[0]] })).toThrow(RangeError);
    expect(() => buildTurntableMesh(box, 30_000)).toThrow(RangeError);
  });
});

describe("viewportScale", () => {
  it("fits the viewport inside the canvas like object-fit: contain", () => {
    // 2 × 4 units in 400 × 400 px: the height limits, 100 px per unit
    expect(viewportScale(box, 400, 400)).toEqual([0.5, 0.5]);
    // 2 × 4 units in 100 × 400 px: the width limits, 50 px per unit
    expect(viewportScale(box, 100, 400)).toEqual([1, 0.25]);
  });
});

describe.each(Object.entries(TURNTABLE_MODELS))("model %s", (_, model) => {
  const { shape } = model;

  it("has ordered slices that close at both ends", () => {
    const ys = shape.rows.map(([y]) => y);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    for (const [, x0, x1, z0, z1] of shape.rows) {
      expect(x1).toBeGreaterThanOrEqual(x0);
      expect(z1).toBeGreaterThanOrEqual(z0);
    }
    for (const [, x0, x1, z0, z1] of [shape.rows[0], shape.rows[shape.rows.length - 1]]) {
      expect(x1 - x0).toBeCloseTo(0, 3);
      expect(z1 - z0).toBeCloseTo(0, 3);
    }
  });

  it("stays inside its viewport at every angle, so the canvas never crops it", () => {
    const { positions } = buildTurntableMesh(shape);
    const { width, height, centerY } = shape.viewport;
    let widest = 0;
    let tallest = 0;
    for (let degrees = 0; degrees < 360; degrees += 5) {
      const angle = (degrees * Math.PI) / 180;
      for (let i = 0; i < positions.length; i += 3) {
        widest = Math.max(widest, Math.abs(positions[i] * Math.cos(angle) + positions[i + 2] * Math.sin(angle)));
        tallest = Math.max(tallest, Math.abs(positions[i + 1] - centerY));
      }
    }
    expect(widest).toBeLessThanOrEqual(width / 2);
    expect(tallest).toBeLessThanOrEqual(height / 2);
  });

  it("frames the poster like the canvas", () => {
    expect(model.poster.width / model.poster.height).toBeCloseTo(shape.viewport.width / shape.viewport.height, 2);
  });
});
