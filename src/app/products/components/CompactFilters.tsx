import { Category, FilterState } from "../types";

interface CompactFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  sortOptions: { id: string; name: string }[];
}

export const CompactFilters = ({
  categories,
  filters,
  onFilterChange,
  sortOptions,
}: CompactFiltersProps) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-wrap items-center gap-6">
        {/* Categories Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Category:</span>
          <select
            value={filters.selectedCategory}
            onChange={(e) => onFilterChange({ selectedCategory: e.target.value })}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white min-w-[160px] transition-all duration-200"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>
        </div>

        {/* Sort Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white min-w-[160px] transition-all duration-200"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Price:</span>
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
            <span className="text-xs text-gray-500">$</span>
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
              className="w-16 px-2 py-1 text-sm border-0 bg-transparent focus:outline-none"
              placeholder="Min"
            />
            <span className="text-gray-400 text-sm">-</span>
            <span className="text-xs text-gray-500">$</span>
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
              className="w-16 px-2 py-1 text-sm border-0 bg-transparent focus:outline-none"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center space-x-4 ml-auto">
          <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors duration-200">
            <input
              type="checkbox"
              checked={filters.inStock || false}
              onChange={(e) => onFilterChange({ inStock: e.target.checked })}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-1"
            />
            <span className="text-sm text-gray-700 font-medium">In Stock</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors duration-200">
            <input
              type="checkbox"
              checked={filters.onSale || false}
              onChange={(e) => onFilterChange({ onSale: e.target.checked })}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-1"
            />
            <span className="text-sm text-gray-700 font-medium">On Sale</span>
          </label>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.selectedCategory}
              onChange={(e) => onFilterChange({ selectedCategory: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Price Range</label>
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-xs text-gray-500">$</span>
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
                className="flex-1 px-2 py-1 text-sm border-0 bg-transparent focus:outline-none"
                placeholder="Min"
              />
              <span className="text-gray-400 text-sm">-</span>
              <span className="text-xs text-gray-500">$</span>
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
                className="flex-1 px-2 py-1 text-sm border-0 bg-transparent focus:outline-none"
                placeholder="Max"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock || false}
                onChange={(e) => onFilterChange({ inStock: e.target.checked })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-1"
              />
              <span className="text-sm text-gray-700">In Stock</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onSale || false}
                onChange={(e) => onFilterChange({ onSale: e.target.checked })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-1"
              />
              <span className="text-sm text-gray-700">On Sale</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
