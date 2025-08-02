import { Product } from "../../components/Product";

export const ProductShowcase = () => {
  return (
    <section className="grid grid-cols-2 w-full p-8 min-h-[70vh]">
      <Product productId="Motxilla 72h" backgroundColor="#c5b3a1" />
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        <Product productId="Menjar" backgroundColor="#585956" />
        <Product productId="Aigua" backgroundColor="#585956" />
        <Product productId="Foc" backgroundColor="#585956" />
        <Product productId="Ganivets" backgroundColor="#585956" />
      </div>
    </section>
  );
};
