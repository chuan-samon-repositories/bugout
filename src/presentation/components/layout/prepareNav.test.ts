import { describe, expect, it } from "vitest";
import { prepareLinks } from "./prepareNav";

describe("prepareLinks", () => {
  it("starts with the first-minutes card, then the Prepárate page's sections and the kit checklist", () => {
    expect(prepareLinks()).toEqual([
      { href: "/preparate/primeros-15-minutos", label: "Primeros 15 minutos" },
      { href: "/preparate#como-prepararte", label: "Cómo prepararte" },
      { href: "/preparate/lista-del-kit-de-emergencia", label: "Lista del kit de emergencia" },
      { href: "/preparate#tarjetas", label: "Tarjetas de acción" },
      { href: "/preparate#primeros-auxilios", label: "Guía de primeros auxilios" },
    ]);
  });
});
