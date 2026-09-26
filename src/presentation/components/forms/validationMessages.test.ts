import { describe, expect, it } from "vitest";
import type { ValidationCode } from "@/application/errors";
import { orderFieldErrors, validationMessage } from "./validationMessages";

describe("validationMessage", () => {
  it("has Spanish copy for every validation code", () => {
    const codes: ValidationCode[] = [
      "required",
      "invalidEmail",
      "invalidPhone",
      "invalidPostalCode",
      "unsupportedRegion",
      "postalCodeMismatch",
      "tooShort",
      "tooLong",
    ];
    for (const code of codes) {
      expect(validationMessage(code)).toMatch(/\.$/);
    }
    expect(validationMessage("required")).toBe("Este campo es obligatorio.");
    expect(validationMessage("postalCodeMismatch")).toBe("Este código postal no corresponde a la provincia seleccionada.");
  });

  it("mentions the length limits when given", () => {
    expect(validationMessage("tooShort", { minLength: 10 })).toBe("Escribe al menos 10 caracteres.");
    expect(validationMessage("tooLong", { maxLength: 2000 })).toBe("Escribe como máximo 2000 caracteres.");
  });
});

describe("orderFieldErrors", () => {
  it("sorts errors in form order and puts unknown fields last", () => {
    expect(orderFieldErrors({ extra: "required", message: "tooShort", email: "invalidEmail" }, ["email", "message"])).toEqual([
      ["email", "invalidEmail"],
      ["message", "tooShort"],
      ["extra", "required"],
    ]);
  });
});
