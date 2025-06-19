import { Decorator } from "./sections/Decorator";
import { MainProducts } from "./sections/MainProducts";
import { Newsletter } from "./sections/Newsletter";
import { Principles } from "./sections/Principles";
import { ProductShowcase } from "./sections/ProductShowcase";

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      <MainProducts />
      <Decorator />
      <ProductShowcase />
      <Newsletter />
      <Principles />
    </main>
  );
}
