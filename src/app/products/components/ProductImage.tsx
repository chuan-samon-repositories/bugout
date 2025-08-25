import Image from "next/image";

interface ProductImageProps {
  productId: string;
  className?: string;
}

export const ProductImage = ({
  productId,
  className = "",
}: ProductImageProps) => {
  // In a real app, you would have multiple images per product
  const imageSrc = "/images/products/backpack.png"; // Could be dynamic based on productId

  const getAltText = (productId: string) => {
    return (
      productId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) +
      " - Professional Survival Kit"
    );
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={imageSrc}
        alt={getAltText(productId)}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-contain hover:scale-105 transition-transform duration-300"
        priority
      />
    </div>
  );
};
