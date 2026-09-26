// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatNumber } from "@/presentation/i18n";
import { RatingStars, starFills } from "./RatingStars";

describe("RatingStars", () => {
  it("renders nothing without rating data or reviews", () => {
    const { container, rerender } = render(<RatingStars rating={null} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<RatingStars rating={{ average: 4.5, count: 0 }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes an accessible Spanish label", () => {
    render(<RatingStars rating={{ average: 4.9, count: 1247 }} />);
    expect(
      screen.getByRole("img", { name: `Valoración 4,9 de 5 (${formatNumber(1247)} opiniones)` }),
    ).toBeInTheDocument();
  });

  it("uses the singular for one review", () => {
    render(<RatingStars rating={{ average: 5, count: 1 }} />);
    expect(screen.getByRole("img", { name: "Valoración 5,0 de 5 (1 opinión)" })).toBeInTheDocument();
  });

  it("shows the visible count only when asked", () => {
    const { rerender } = render(<RatingStars rating={{ average: 4.7, count: 12 }} />);
    expect(screen.queryByText("12 opiniones")).toBeNull();
    rerender(<RatingStars rating={{ average: 4.7, count: 12 }} showCount />);
    expect(screen.getByText("12 opiniones", { exact: false })).toBeInTheDocument();
  });

  it("rounds to the nearest half star", () => {
    expect(starFills(4.9)).toEqual(["full", "full", "full", "full", "full"]);
    expect(starFills(4.7)).toEqual(["full", "full", "full", "full", "half"]);
    expect(starFills(4.2)).toEqual(["full", "full", "full", "full", "empty"]);
    expect(starFills(0)).toEqual(["empty", "empty", "empty", "empty", "empty"]);
  });
});
