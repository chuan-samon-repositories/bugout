// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProduct } from "@/domain/testing/buildProduct";
import { getContainer } from "@/infrastructure/config";
import { messages } from "@/presentation/i18n";
import FaqPage from "./page";

const kit = (id: string, name: string, people: string[]) =>
  buildProduct({
    id,
    name,
    category: "kits",
    rating: null,
    details: { features: [], specifications: [], contents: [], kit: { label: id.toUpperCase() } },
    variants: people.map((value, index) => ({
      id: `${id}-${index}`,
      title: value,
      price: 39 + index * 30,
      options: [{ name: "Personas", value }],
    })),
  });

describe("/faq", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("answers the kit questions from the demo catalog", async () => {
    render(await FaqPage());
    expect(screen.getByRole("heading", { level: 1, name: "Preguntas frecuentes" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sí. El Kit 24h y el Kit 72h se venden para 1, 2 o 4 personas: elige el número de personas en la página de cada kit.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Kit 72h:")).toBeInTheDocument();
    expect(screen.queryByText(/te avisamos/i)).toBeNull();
  });

  it("reads people counts whether option values are '2' or '2 personas'", async () => {
    vi.spyOn(getContainer().getGetProductsUseCase(), "execute").mockResolvedValue([
      kit("kit-a", "Kit A", ["1 persona", "2 personas"]),
      kit("kit-b", "Kit B", ["2", "4"]),
      kit("kit-c", "Kit C", ["1", "6 personas"]),
    ]);
    render(await FaqPage());
    expect(
      screen.getByText(
        "Sí. El Kit A, el Kit B y el Kit C se venden para 1, 2, 4 o 6 personas: elige el número de personas en la página de cada kit.",
      ),
    ).toBeInTheDocument();
  });
});

describe("faqPage.peopleAnswer", () => {
  it("agrees in number with a single kit", () => {
    expect(messages.content.faqPage.peopleAnswer(["Kit 72h"], "1 o 2")).toBe(
      "Sí. El Kit 72h se vende para 1 o 2 personas: elige el número de personas en la página de cada kit.",
    );
  });
});
