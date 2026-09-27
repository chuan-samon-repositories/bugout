// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FrogMascot } from "./FrogMascot";
import { SectionHeading } from "./SectionHeading";

describe("FrogMascot", () => {
  it("is a decorative sprite animation", () => {
    const { container } = render(<FrogMascot className="[--frog-size:140px]" />);
    const frog = container.firstElementChild!;
    expect(frog).toHaveAttribute("aria-hidden", "true");
    expect(frog.className).toContain("frog-breathe");
    expect(frog.className).toContain("[--frog-size:140px]");
  });
});

describe("SectionHeading", () => {
  it("renders the eyebrow, an h2 with the given id and the description", () => {
    const { getByRole, getByText } = render(
      <SectionHeading id="kits-title" eyebrow="Los kits" title="Elige tu kit" description="Revisados pieza a pieza." />,
    );
    expect(getByRole("heading", { level: 2, name: "Elige tu kit" })).toHaveAttribute("id", "kits-title");
    expect(getByText("Los kits")).toBeInTheDocument();
    expect(getByText("Revisados pieza a pieza.")).toBeInTheDocument();
  });
});
