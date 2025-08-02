import Image from "next/image";

interface ProductImageProps {
  productId: string;
}

export const ProductImage = ({ productId }: ProductImageProps) => {
  return (
    <div>
      <Image
        src={`/images/products/backpack.png`}
        alt={productId}
        width={500}
        height={500}
      />
    </div>
  );
};

// ${productId.toLowerCase().replaceAll(" ", "-")}
