// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { resetContainer } from "@/infrastructure/config";
import { Header } from "./Header";
import type { NavData } from "./navigation";

const navigation = vi.hoisted(() => ({ pathname: "/", search: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

const defaultNav: NavData = {
  kits: [
    { slug: "kit-24h", label: "Kit 24h" },
    { slug: "kit-72h", label: "Kit 72h" },
  ],
  flagshipSlug: "kit-72h",
};

function renderHeader(nav: NavData = defaultNav) {
  return render(
    <Providers>
      <Header nav={nav} />
    </Providers>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    localStorage.clear();
    resetContainer();
    navigation.pathname = "/";
    navigation.search = "";
  });

  it("links the logo home without using a heading", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "Bugout, ir al inicio" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("requests the logo at its display size and preloads only the always-visible mark", () => {
    renderHeader();
    const [mark, wordmark] = Array.from(screen.getByRole("link", { name: "Bugout, ir al inicio" }).querySelectorAll("img"));
    expect(mark).toHaveAttribute("width", "40");
    expect(wordmark).toHaveAttribute("width", "88");
    for (const image of [mark, wordmark]) {
      // 1x and 2x of the display size, never the ~1000px source.
      expect(image.getAttribute("srcset")).not.toMatch(/w=(640|750|828|1080|1200|1920|2048|3840)\b/);
    }
    expect(mark).not.toHaveAttribute("loading", "lazy");
    // The wordmark is hidden on narrow phones: lazy and not preloaded, so they never download it.
    expect(wordmark).toHaveAttribute("loading", "lazy");
    const preloads = Array.from(document.head.querySelectorAll('link[rel="preload"][as="image"]')).map(
      (link) => link.getAttribute("imagesrcset") ?? "",
    );
    expect(preloads.some((srcset) => srcset.includes("mark-cream"))).toBe(true);
    expect(preloads.some((srcset) => srcset.includes("wordmark"))).toBe(false);
  });

  it("renders the kits and content pages and marks the current page", () => {
    navigation.pathname = "/products/kit-72h";
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Principal" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Kit 24h",
      "Kit 72h",
      "Productos",
      "Cómo elegir",
      "Sobre nosotros",
      "Prepárate",
    ]);
    expect(within(nav).getByRole("link", { name: "Kit 72h" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Kit 24h" })).not.toHaveAttribute("aria-current");
  });

  it("links the call to action to the flagship kit, or to the catalog without kits", () => {
    const { unmount } = renderHeader();
    expect(screen.getAllByRole("link", { name: "Compra ahora" })[0]).toHaveAttribute("href", "/products/kit-72h");
    unmount();

    renderHeader({ kits: [], flagshipSlug: null });
    expect(screen.getByRole("link", { name: "Compra ahora" })).toHaveAttribute("href", "/products");
    const fixed = within(screen.getByRole("navigation", { name: "Principal" })).getAllByRole("link");
    expect(fixed.map((link) => link.textContent)).toEqual(["Productos", "Cómo elegir", "Sobre nosotros", "Prepárate"]);
  });

  it("is transparent over the home hero until the visitor scrolls, and solid elsewhere", () => {
    const { unmount } = renderHeader();
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-transparent", "true");

    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header).not.toHaveAttribute("data-transparent");
    unmount();

    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    navigation.pathname = "/about";
    renderHeader();
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-transparent");
  });

  it("gives the current link one text colour, never both the idle and the current one", async () => {
    navigation.pathname = "/products/kit-72h";
    const user = userEvent.setup();
    renderHeader();
    const classes = (link: HTMLElement) => link.className.split(/\s+/);
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(classes(within(nav).getByRole("link", { name: "Kit 72h" }))).toContain("text-sand");
    expect(classes(within(nav).getByRole("link", { name: "Kit 72h" }))).not.toContain("text-sand/85");
    expect(classes(within(nav).getByRole("link", { name: "Kit 24h" }))).toContain("text-sand/85");

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    const menu = within(screen.getByRole("dialog", { name: "Menú" }));
    const current = classes(menu.getByRole("link", { name: "Kit 72h" }));
    expect(current).toContain("text-orange-on-navy");
    expect(current).not.toContain("text-sand");
    expect(classes(menu.getByRole("link", { name: "Kit 24h" }))).toContain("text-sand");
    expect(classes(menu.getByRole("link", { name: "Kit 24h" }))).not.toContain("text-orange-on-navy");
  });

  it("toggles aria-expanded and opens the menu drawer", async () => {
    const user = userEvent.setup();
    renderHeader();
    const menuButton = screen.getByRole("button", { name: "Abrir menú" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: "Menú" });
    expect(within(dialog).getByRole("link", { name: "Kit 24h" })).toHaveAttribute("href", "/products/kit-24h");
    expect(within(dialog).getByRole("link", { name: "Compra ahora" })).toHaveAttribute("href", "/products/kit-72h");

    const preventNavigation = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("click", preventNavigation);
    await user.click(within(dialog).getByRole("link", { name: "Sobre nosotros" }));
    document.removeEventListener("click", preventNavigation);
    expect(screen.queryByRole("dialog", { name: "Menú" })).toBeNull();
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("names the cart button after its contents and opens the cart drawer", async () => {
    localStorage.setItem(
      "bugout.cart",
      JSON.stringify({
        version: 2,
        items: [
          { productId: "kit-medicina", quantity: 1 },
          { productId: "kit-24h-2p", quantity: 1 },
        ],
      }),
    );
    const user = userEvent.setup();
    renderHeader();

    const cartButton = await screen.findByRole("button", { name: "Carrito, 2 artículos" });
    await user.click(cartButton);

    expect(screen.getByRole("dialog", { name: "Tu carrito" })).toBeInTheDocument();
  });

  it("announces an empty cart", async () => {
    renderHeader();
    expect(await screen.findByRole("button", { name: "Carrito vacío" })).toBeInTheDocument();
  });
});
