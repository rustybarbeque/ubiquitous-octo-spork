"use client";

import { Select } from "antd";
import { Product, SortOption } from "@/lib/types";
import ProductCard from "./ProductCard";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "availability-desc", label: "Availability: Most in Stock" },
  { value: "availability-asc", label: "Availability: Fewest in Stock" },
];

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  /** Products with an add-to-cart request in flight. */
  pendingItemIds: ReadonlySet<string>;
}

export default function ProductGrid({ products, onAddToCart, sort, onSortChange, pendingItemIds }: ProductGridProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-end gap-3 whitespace-nowrap bg-white px-4 py-3 sm:px-6">
        <span className="text-sm text-zinc-500">{products.length} items</span>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          Sort by
          <Select
            value={sort}
            onChange={(value) => onSortChange(value)}
            options={SORT_OPTIONS}
            style={{ width: 210 }}
          />
        </label>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
          <p className="text-sm text-zinc-500">No items match your search.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                adding={pendingItemIds.has(product.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
