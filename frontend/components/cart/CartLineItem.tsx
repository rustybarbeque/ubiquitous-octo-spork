"use client";

import ProductImage from "@/components/ProductImage";
import { Button, Tooltip } from "antd";
import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/format";
import { CartLine } from "@/lib/types";

/** The API rejects quantities above this, regardless of stock. */
const MAX_LINE_QUANTITY = 1000;

export default function CartLineItem({ line }: { line: CartLine }) {
  const { pendingItemIds, setQuantity, removeItem } = useCart();
  const pending = pendingItemIds.has(line.itemId);
  const atStockLimit = line.quantity >= Math.min(line.quantityAvailable, MAX_LINE_QUANTITY);

  return (
    <li className="flex gap-3 py-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">
        <ProductImage src={line.imageUrl} alt={line.name} sizes="64px" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-zinc-900">{line.name}</p>
          <p className="shrink-0 text-sm font-semibold text-zinc-900">{formatMoney(line.lineSubtotal)}</p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
          {line.isOnSale ? (
            <>
              <span className="rounded-full bg-red-600 px-1.5 py-px font-semibold text-white">Sale</span>
              <span className="font-medium text-red-600">{formatMoney(line.unitPrice)} each</span>
              <span className="text-zinc-400 line-through">{formatMoney(line.regularPrice)}</span>
              <span className="text-red-600">Save {formatMoney(line.savingsPerUnit)} each</span>
            </>
          ) : (
            <span className="text-zinc-500">{formatMoney(line.unitPrice)} each</span>
          )}
        </div>

        {line.exceedsAvailable && (
          <p className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            Only {line.quantityAvailable} in stock. Lower the quantity to check out.
          </p>
        )}

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center rounded-md border border-zinc-200">
            <Button
              type="text"
              size="small"
              icon={<Minus className="h-3.5 w-3.5" />}
              aria-label={`Decrease quantity of ${line.name}`}
              disabled={pending || line.quantity <= 1}
              onClick={() => setQuantity(line.itemId, line.quantity - 1)}
            />
            <span className="min-w-8 text-center text-sm tabular-nums" aria-live="polite">
              {line.quantity}
            </span>
            <Tooltip title={atStockLimit ? "No more in stock" : undefined}>
              <Button
                type="text"
                size="small"
                icon={<Plus className="h-3.5 w-3.5" />}
                aria-label={`Increase quantity of ${line.name}`}
                disabled={pending || atStockLimit}
                onClick={() => setQuantity(line.itemId, line.quantity + 1)}
              />
            </Tooltip>
          </div>

          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 className="h-3.5 w-3.5" />}
            loading={pending}
            onClick={() => removeItem(line.itemId)}
          >
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}
