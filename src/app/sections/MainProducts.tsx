import { Product } from "../../components/Product";

export const MainProducts = () => {
  return (
    <section className="flex flex-row min-h-[70vh] w-full p-10">
      <Product productId="Motxilla 72h" backgroundColor="#c5b3a1" />
      <Product productId="Feste la teva motxilla!" backgroundColor="#585956" />
      <Product productId="Motxilla 24h" backgroundColor="#c5b3a1" />
    </section>
  );
};
