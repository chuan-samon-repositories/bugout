import { describe, expect, it } from "vitest";
import { ACTION_CARDS } from "@/presentation/prepare/cards";
import { GET, generateStaticParams } from "./route";

describe("/preparate/[slug]/share-image", () => {
  it("prerenders one image per card", () => {
    expect(generateStaticParams()).toEqual(ACTION_CARDS.map((card) => ({ slug: card.slug })));
  });

  it("draws a card's image and answers 404 for anything else", async () => {
    const image = await GET(new Request("http://localhost/"), { params: Promise.resolve({ slug: "fuga-de-gas" }) });
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/png");
    const missing = await GET(new Request("http://localhost/"), { params: Promise.resolve({ slug: "no-existe" }) });
    expect(missing.status).toBe(404);
  });
});
