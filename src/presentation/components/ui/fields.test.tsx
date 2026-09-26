// @vitest-environment jsdom
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckboxField } from "./CheckboxField";
import { RadioGroupField } from "./RadioGroupField";
import { SelectField } from "./SelectField";
import { TextAreaField } from "./TextAreaField";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("associates the label and generates an id", () => {
    render(<TextField name="email" label="Correo electrónico" type="email" />);
    const input = screen.getByLabelText("Correo electrónico");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("type", "email");
    expect(input.id).not.toBe("");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("describes the field with hint and error and marks it invalid", () => {
    render(<TextField id="email" name="email" label="Correo" hint="Te enviaremos la confirmación" error="Introduce un correo válido" />);
    const input = screen.getByLabelText("Correo");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-hint email-error");
    expect(input).toHaveAccessibleDescription("Te enviaremos la confirmación Introduce un correo válido");
    expect(screen.getByText("Introduce un correo válido")).toHaveClass("text-danger");
  });

  it("marks required fields without reading the asterisk", () => {
    render(<TextField name="name" label="Nombre" required />);
    const input = screen.getByRole("textbox", { name: "Nombre" });
    expect(input).toBeRequired();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("forwards refs and change events", async () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    render(<TextField ref={ref} name="city" label="Ciudad" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Ciudad"), "Bilbao");
    expect(ref.current?.value).toBe("Bilbao");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("TextAreaField", () => {
  it("labels the textarea and links the error", () => {
    render(<TextAreaField name="message" label="Mensaje" error="Obligatorio" />);
    const textarea = screen.getByRole("textbox", { name: "Mensaje" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAccessibleDescription("Obligatorio");
  });
});

describe("SelectField", () => {
  it("renders options and a placeholder", async () => {
    render(
      <SelectField
        name="province"
        label="Provincia"
        placeholder="Selecciona…"
        hint="Solo península"
        options={[
          { value: "madrid", label: "Madrid" },
          { value: "bizkaia", label: "Bizkaia" },
        ]}
      />,
    );
    const select = screen.getByRole("combobox", { name: "Provincia" });
    expect(select).toHaveAccessibleDescription("Solo península");
    await userEvent.selectOptions(select, "bizkaia");
    expect(select).toHaveValue("bizkaia");
  });
});

describe("CheckboxField", () => {
  it("labels the checkbox and exposes errors", async () => {
    render(<CheckboxField name="terms" label="Acepto las condiciones" required error="Debes aceptar" />);
    const checkbox = screen.getByRole("checkbox", { name: "Acepto las condiciones" });
    expect(checkbox).toBeRequired();
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAccessibleDescription("Debes aceptar");
    await userEvent.click(screen.getByText("Acepto las condiciones"));
    expect(checkbox).toBeChecked();
  });
});

describe("RadioGroupField", () => {
  const options = [
    { value: "standard", label: "Estándar", description: "3–5 días", aside: "4,95 €" },
    { value: "express", label: "Exprés", aside: "9,95 €" },
  ];

  it("groups options in a fieldset with a legend", () => {
    render(<RadioGroupField name="shipping" label="Método de envío" options={options} hint="Elige uno" error="Obligatorio" />);
    const group = screen.getByRole("group", { name: "Método de envío" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription("Elige uno Obligatorio");
    const standard = screen.getByRole("radio", { name: /Estándar/ });
    expect(standard).toHaveAccessibleDescription("3–5 días");
    expect(screen.getByText("9,95 €")).toBeInTheDocument();
  });

  it("reports the selected value", async () => {
    const onValueChange = vi.fn();
    render(<RadioGroupField name="shipping" label="Envío" options={options} value="standard" onValueChange={onValueChange} />);
    expect(screen.getByRole("radio", { name: /Estándar/ })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: /Exprés/ }));
    expect(onValueChange).toHaveBeenCalledWith("express", expect.anything());
  });
});
