// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { resetContainer } from "@/infrastructure/config";
import { Header } from "./Header";

const navigation = vi.hoisted(() => ({ pathname: "/", search: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

const categories = [
  { slug: "survival-kits", label: "Kits de supervivencia" },
  { slug: "accessories", label: "Accesorios" },
];

function renderHeader(navCategories: typeof categories = categories) {
  return render(
    <Providers>
      <Header categories={navCategories} />
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

  it("renders the primary navigation and marks the current catalog filter", () => {
    navigation.pathname = "/products";
    navigation.search = "category=accessories&sort=rating";
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Principal" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Todos los productos",
      "Kits de supervivencia",
      "Accesorios",
      "Ofertas",
      "Sobre nosotros",
      "Contacto",
    ]);
    expect(within(nav).getByRole("link", { name: "Accesorios" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Accesorios" })).toHaveAttribute("href", "/products?category=accessories");
    expect(within(nav).getByRole("link", { name: "Todos los productos" })).not.toHaveAttribute("aria-current");
  });

  it("lists whatever categories the catalog has, and only the fixed links without a catalog", () => {
    const { unmount } = renderHeader([{ slug: "camping-gear", label: "Camping" }]);
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(within(nav).getByRole("link", { name: "Camping" })).toHaveAttribute("href", "/products?category=camping-gear");
    expect(within(nav).queryByRole("link", { name: "Accesorios" })).toBeNull();
    unmount();

    renderHeader([]);
    const fixed = within(screen.getByRole("navigation", { name: "Principal" })).getAllByRole("link");
    expect(fixed.map((link) => link.textContent)).toEqual(["Todos los productos", "Ofertas", "Sobre nosotros", "Contacto"]);
  });

  it("toggles aria-expanded and opens the menu drawer", async () => {
    const user = userEvent.setup();
    renderHeader();
    const menuButton = screen.getByRole("button", { name: "Abrir menú" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: "Menú" });
    expect(within(dialog).getByRole("link", { name: "Ofertas" })).toHaveAttribute("href", "/products?sale=1");
    expect(within(dialog).getByRole("link", { name: "Kits de supervivencia" })).toHaveAttribute(
      "href",
      "/products?category=survival-kits",
    );

    const preventNavigation = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("click", preventNavigation);
    await user.click(within(dialog).getByRole("link", { name: "Contacto" }));
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
          { productId: "first-aid-pro", quantity: 1 },
          { productId: "emergency-food-pack", quantity: 1 },
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
