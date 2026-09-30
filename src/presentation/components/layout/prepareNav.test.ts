import { describe, expect, it } from "vitest";
import { prepareLinks } from "./prepareNav";

describe("prepareLinks", () => {
  it("starts with the first-minutes card, then the Prepárate page's sections", () => {
    expect(prepareLinks()).toEqual([
      { href: "/why-prepare/primeros-15-minutos", label: "Primeros 15 minutos" },
      { href: "/why-prepare#como-prepararte", label: "Cómo prepararte" },
      { href: "/why-prepare#tarjetas", label: "Tarjetas de acción" },
      { href: "/why-prepare#primeros-auxilios", label: "Guía de primeros auxilios" },
    ]);
  });
});
