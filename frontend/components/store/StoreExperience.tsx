"use client";

import { useMemo, useState } from "react";
import { Product, SortOption } from "@/lib/types";
import StoreHeader from "@/components/header/StoreHeader";
import ProductGrid from "@/components/store/ProductGrid";
import { useCart } from "@/components/cart/CartProvider";

interface StoreExperienceProps {
  products: Product[];
}

export default function StoreExperience({ products }: StoreExperienceProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("relevance");
  const { addItem, pendingItemIds } = useCart();

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });

    const sorted = [...filtered];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        break;
      case "availability-desc":
        sorted.sort((a, b) => b.quantityAvailable - a.quantityAvailable);
        break;
      case "availability-asc":
        sorted.sort((a, b) => a.quantityAvailable - b.quantityAvailable);
        break;
      default:
        break;
    }
    return sorted;
  }, [products, query, sort]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50">
      <StoreHeader query={query} onQueryChange={setQuery} />
      <ProductGrid
        products={visibleProducts}
        onAddToCart={addItem}
        pendingItemIds={pendingItemIds}
        sort={sort}
        onSortChange={setSort}
      />
    </div>
  );
}
