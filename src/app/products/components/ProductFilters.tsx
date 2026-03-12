import { Category, FilterState } from "../types";

interface ProductFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export const ProductFilters = ({
  categories,
  filters,
  onFilterChange,
}: ProductFiltersProps) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 sticky top-24">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Filters</h2>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onFilterChange({ selectedCategory: category.id })}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                filters.selectedCategory === category.id
                  ? "bg-orange-100 text-orange-800 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{category.name}</span>
              <span className="float-right text-sm">({category.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={filters.priceRange[0]}
              onChange={(e) =>
                onFilterChange({
                  priceRange: [
                    parseInt(e.target.value) || 0,
                    filters.priceRange[1],
                  ],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Min"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              value={filters.priceRange[1]}
              onChange={(e) =>
                onFilterChange({
                  priceRange: [
                    filters.priceRange[0],
                    parseInt(e.target.value) || 500,
                  ],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Max"
            />
          </div>
          <div className="text-sm text-gray-600">
            ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Quick Filters</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.inStock || false}
              onChange={(e) => onFilterChange({ inStock: e.target.checked })}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-600">In Stock</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.onSale || false}
              onChange={(e) => onFilterChange({ onSale: e.target.checked })}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-600">On Sale</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.freeShipping || false}
              onChange={(e) =>
                onFilterChange({ freeShipping: e.target.checked })
              }
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-600">Free Shipping</span>
          </label>
        </div>
      </div>
    </div>
  );
};
