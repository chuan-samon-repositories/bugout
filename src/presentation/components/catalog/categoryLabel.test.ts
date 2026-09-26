import { describe, expect, it } from "vitest";
import { categoryLabel } from "./categoryLabel";

describe("categoryLabel", () => {
  it("translates known categories and humanises unknown slugs", () => {
    expect(categoryLabel("survival-kits")).toBe("Kits de supervivencia");
    expect(categoryLabel("accessories")).toBe("Accesorios");
    expect(categoryLabel("general")).toBe("Otros");
    expect(categoryLabel("camping-gear")).toBe("Camping gear");
  });
});
