import Link from "next/link";
import { Product } from "../types";
import { ProductImage } from "./ProductImage";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        <Link href={`/products/${product.id}`}>
          <ProductImage
            productId={product.id}
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Badge */}
        {product.badge && (
          <div
            className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold ${
              product.badge === "SALE"
                ? "bg-red-500 text-white"
                : product.badge === "BESTSELLER"
                ? "bg-orange-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            {product.badge}
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors duration-200">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold">OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-200">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-sm ${
                  i < Math.floor(product.rating)
                    ? "text-orange-500"
                    : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.id}`}
            className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};
