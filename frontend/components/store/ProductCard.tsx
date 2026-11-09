"use client";

import ProductImage from "@/components/ProductImage";
import { Button } from "antd";
import { Plus } from "lucide-react";
import { Product } from "@/lib/types";

// Width stays 100% of the card; this only controls the height relative to it.
// 1 = square. Higher = shorter (e.g. 4/3 is noticeably shorter, 6/5 is only slightly shorter).
const PRODUCT_IMAGE_ASPECT_RATIO = 6 / 5;

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  /** An add-to-cart request for this product is in flight. */
  adding?: boolean;
}

export default function ProductCard({ product, onAddToCart, adding = false }: ProductCardProps) {
  const isOnSale = product.salePrice !== null;
  const isOutOfStock = product.quantityAvailable === 0;
  const isLowStock = product.quantityAvailable > 0 && product.quantityAvailable <= 5;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md">
      <div
        className="relative w-full bg-zinc-100"
        style={{ aspectRatio: PRODUCT_IMAGE_ASPECT_RATIO }}
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        {isOnSale && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            Sale
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{product.category}</p>
        <h3 className="text-sm font-medium text-zinc-900">{product.name}</h3>
        <p className="line-clamp-2 text-xs text-zinc-500">{product.description}</p>

        <div className="mt-auto flex flex-col gap-1 pt-1">
          <div className="flex items-baseline gap-2">
            {isOnSale ? (
              <>
                <span className="text-base font-semibold text-red-600">
                  ${product.salePrice!.toFixed(2)}
                </span>
                <span className="text-xs text-zinc-400 line-through">${product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-base font-semibold text-zinc-900">${product.price.toFixed(2)}</span>
            )}
          </div>

          <p
            className={`text-xs ${
              isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-600" : "text-zinc-500"
            }`}
          >
            {isOutOfStock
              ? "Out of stock"
              : isLowStock
                ? `Only ${product.quantityAvailable} left`
                : `${product.quantityAvailable} available`}
          </p>

          <Button
            type="primary"
            block
            disabled={isOutOfStock}
            loading={adding}
            onClick={() => onAddToCart(product)}
            icon={<Plus className="h-4 w-4" strokeWidth={2} />}
            className="mt-1"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
