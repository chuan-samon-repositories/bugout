import Link from "next/link";

interface ProductsHeaderProps {
  productCount: number;
}

export const ProductsHeader = ({ productCount }: ProductsHeaderProps) => {
  return (
    <div className="mb-8">
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <Link
          href="/"
          className="hover:text-orange-600 transition-colors duration-200"
        >
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Products</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Survival Products
          </h1>
          <p className="text-xl text-gray-600">
            Professional emergency preparedness gear for every situation
          </p>
        </div>

        <div className="mt-4 lg:mt-0">
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            {productCount} products found
          </span>
        </div>
      </div>
    </div>
  );
};
