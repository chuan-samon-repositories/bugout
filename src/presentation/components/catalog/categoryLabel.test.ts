import { describe, expect, it } from "vitest";
import { categoryLabel } from "./categoryLabel";

describe("categoryLabel", () => {
  it("translates known categories and humanises unknown slugs", () => {
    expect(categoryLabel("kits")).toBe("Kits");
    expect(categoryLabel("luz-y-energia")).toBe("Luz y energía");
    expect(categoryLabel("refugio-y-abrigo")).toBe("Refugio y abrigo");
    expect(categoryLabel("general")).toBe("Otros");
    expect(categoryLabel("camping-gear")).toBe("Camping gear");
  });
});
