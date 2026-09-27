// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeHero } from "@/presentation/components/home/HomeHero";
import { WhyPrepareTeaser } from "@/presentation/components/home/WhyPrepareTeaser";
import NotFound from "@/app/not-found";
import { MASCOT_ENABLED } from "./mascot";

const mascot = vi.hoisted(() => ({ enabled: false }));

vi.mock("./mascot", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./mascot")>()),
  isMascotEnabled: () => mascot.enabled,
}));

const kits = [{ slug: "kit-24h", label: "Kit 24h" }];

/** Renders every place the frog can appear and returns the frog elements found. */
function renderFrogPlaces() {
  const { container } = render(
    <>
      <HomeHero kits={kits} scrollTargetId="kits" />
      <WhyPrepareTeaser />
      <NotFound />
    </>,
  );
  return {
    sprites: container.querySelectorAll(".frog-breathe"),
    images: container.querySelectorAll('img[src*="frog"]'),
  };
}

describe("frog mascot switch", () => {
  beforeEach(() => {
    mascot.enabled = false;
  });

  it("is off: the frog has no role on the site yet", () => {
    expect(MASCOT_ENABLED).toBe(false);
  });

  it("hides the frog everywhere while disabled", () => {
    const { sprites, images } = renderFrogPlaces();
    expect(sprites).toHaveLength(0);
    expect(images).toHaveLength(0);
  });

  it("shows it again in the hero, the why-prepare teaser and the 404 page when enabled", () => {
    mascot.enabled = true;
    const { sprites, images } = renderFrogPlaces();
    expect(sprites).toHaveLength(2);
    expect(images).toHaveLength(1);
  });
});
