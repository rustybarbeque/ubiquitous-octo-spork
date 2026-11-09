import ProductImage from "@/components/ProductImage";
import { AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/format";

interface LineItemRowProps {
  name: string;
  imageUrl: string;
  category: string;
  quantity: number;
  unitPrice: number;
  regularPrice: number;
  isOnSale: boolean;
  lineSubtotal: number;
  /** Shown under the price, e.g. a stock problem at checkout. */
  warning?: string;
}

/** A read-only product line, for the checkout review and order details. */
export default function LineItemRow(props: LineItemRowProps) {
  const { name, imageUrl, category, quantity, unitPrice, regularPrice, isOnSale, lineSubtotal, warning } = props;

  return (
    <li className="flex gap-4 py-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
        <ProductImage src={imageUrl} alt={name} sizes="80px" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{category}</p>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-zinc-900">{name}</p>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">{formatMoney(lineSubtotal)}</p>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
          <span className="text-zinc-500">Qty {quantity} ×</span>
          {isOnSale ? (
            <>
              <span className="rounded-full bg-red-600 px-1.5 py-px font-semibold text-white">Sale</span>
              <span className="font-medium text-red-600">{formatMoney(unitPrice)}</span>
              <span className="text-zinc-400 line-through">{formatMoney(regularPrice)}</span>
            </>
          ) : (
            <span className="text-zinc-500">{formatMoney(unitPrice)}</span>
          )}
        </div>
        {warning && (
          <p className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {warning}
          </p>
        )}
      </div>
    </li>
  );
}
