// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { KitCard, KitCardGrid, peopleSummary } from "./KitCard";

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

  it("shows the Kit 72h's backpack instead of the gradient header, sticking out above the card", () => {
    const kit72h = buildProduct({
      id: "kit-72h",
      name: "Kit 72h",
      category: "kits",
      rating: null,
      details: details({ label: "72H" }),
    });
    const { container } = render(<KitCard kit={kit72h} index={1} />);
    const media = container.querySelector("[data-media]");
    expect(media).toHaveAttribute("data-media", "photo");
    expect(media?.className).not.toMatch(/bg-linear|from-/);
    const photo = media?.querySelector("[data-swing] img");
    expect(photo).toHaveAttribute("src", "/images/kit-cards/kit-72h.webp");
    expect(photo).toHaveAttribute("alt", "");
    expect(screen.getByText("72H")).toBeInTheDocument();
    // the photo is taller than the header and the card does not clip it, so it sticks out above
    expect(media?.querySelector<HTMLElement>("[data-swing]")?.parentElement?.style.height).toBe("266px");
    expect(container.querySelector("article")?.className).not.toContain("overflow-hidden");
  });

  it("shows the Kit 24h's own backpack", () => {
    const { container } = render(<KitCard kit={sized(["1 persona"])} index={0} />);
    expect(container.querySelector("[data-media] img")).toHaveAttribute("src", "/images/kit-cards/kit-24h.webp");
    expect(container.querySelector<HTMLElement>("[data-swing]")?.parentElement?.style.height).toBe("232px");
  });

  it("keeps the gradient header for kits without a photo", () => {
    const custom = buildProduct({
      id: "kit-custom",
      name: "Kit Custom",
      category: "kits",
      price: 59,
      rating: null,
      details: details({ label: "CUSTOM", buildYourOwn: true }),
    });
    const { container } = render(<KitCard kit={custom} index={2} />);
    const media = container.querySelector("[data-media]");
    expect(media).toHaveAttribute("data-media", "gradient");
    expect(media?.className).toContain("from-navy-deep");
    expect(media?.querySelector("img")).toBeNull();
    expect(container.querySelector("article")?.className).toContain("overflow-hidden");
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

describe("KitCardGrid", () => {
  const custom = buildProduct({
    id: "kit-custom",
    name: "Kit Custom",
    category: "kits",
    rating: null,
    details: details({ label: "CUSTOM", buildYourOwn: true }),
  });

  it("makes room above and between the cards for the tallest photo sticking out", () => {
    const { container } = render(<KitCardGrid kits={[sized(["1 persona"]), custom]} />);
    const grid = container.querySelector("ul");
    // the Kit 24h photo is 232 px tall and its bottom sits 148 px down the card: it rises 84 px
    expect(grid?.style.paddingTop).toBe("84px");
    expect(grid?.style.rowGap).toBe("112px");
  });

  it("keeps the plain spacing when no card has a photo", () => {
    const { container } = render(<KitCardGrid kits={[custom]} />);
    expect(container.querySelector("ul")?.getAttribute("style")).toBeNull();
    expect(container.querySelector("ul")?.className).toContain("gap-y-7");
  });
});
