import Link from "next/link";

interface ProductProps {
  productId: string;
  backgroundColor: string;
}

export const Product = ({ productId, backgroundColor }: ProductProps) => {
  return (
    <div
      className="flex flex-1 justify-center items-top m-5 p-15 text-white font-bold"
      style={{ backgroundColor }}
    >
      <Link href={`/products/${productId.toLowerCase().replaceAll(" ", "-")}`}>
        {productId}
      </Link>
    </div>
  );
};
