// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { KitCard, peopleSummary } from "./KitCard";

const details = (kit: { label: string; buildYourOwn?: boolean }) => ({
  features: [],
  specifications: [{ label: "Peso", value: "1,8 kg" }],
  contents: [],
  kit,
});

const sized = (values: string[]) =>
  buildProduct({
    id: "kit-24h",
    name: "Kit 24h",
    category: "kits",
    rating: null,
    details: details({ label: "24H" }),
    variants: values.map((value, index) => ({
      id: `kit-24h-${index}`,
      title: value,
      price: 39 + index * 30,
      options: [{ name: "Personas", value }],
    })),
  });

describe("KitCard", () => {
  it("lists the people options whether Shopify sends '2' or '2 personas'", () => {
    expect(peopleSummary(sized(["1", "2", "4"]))).toBe("1, 2 o 4");
    expect(peopleSummary(sized(["1 persona", "2 personas", "4 personas"]))).toBe("1, 2 o 4");
  });

  it("shows the facts, a starting price and a link named after the kit", () => {
    render(<KitCard kit={sized(["1 persona", "2 personas"])} index={0} />);
    expect(screen.getByText("Personas: 1 o 2")).toBeInTheDocument();
    expect(screen.getByText("Peso: 1,8 kg")).toBeInTheDocument();
    expect(screen.getByText("Desde 39,00 €")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver el kit: Kit 24h" })).toHaveAttribute("href", "/products/kit-24h");
  });

  it("prices a build-your-own base as a starting point", () => {
    const custom = buildProduct({
      id: "kit-custom",
      name: "Kit Custom",
      category: "kits",
      price: 59,
      rating: null,
      details: details({ label: "CUSTOM", buildYourOwn: true }),
    });
    render(<KitCard kit={custom} index={2} />);
    expect(screen.getByText("Desde 59,00 €")).toBeInTheDocument();
    expect(screen.queryByText(/^Personas/)).toBeNull();
  });
});
