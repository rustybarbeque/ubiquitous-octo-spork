import { formatMoney } from "@/lib/format";

export interface PriceSummaryProps {
  itemCount: number;
  subtotal: number;
  /** The code shown beside the discount line; the line is hidden when amount is 0. */
  discountCode: string | null;
  discountAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
}

/**
 * Subtotal, discount, tax, and total, exactly as the API computed them.
 * Used for live carts and for frozen orders alike.
 */
export default function PriceSummary({
  itemCount,
  subtotal,
  discountCode,
  discountAmount,
  taxRatePercent,
  taxAmount,
  total,
}: PriceSummaryProps) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-zinc-600">
          Subtotal ({itemCount} item{itemCount === 1 ? "" : "s"})
        </dt>
        <dd className="tabular-nums text-zinc-900">{formatMoney(subtotal)}</dd>
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-green-700">
          <dt>Discount{discountCode ? ` (${discountCode})` : ""}</dt>
          <dd className="tabular-nums">−{formatMoney(discountAmount)}</dd>
        </div>
      )}

      <div className="flex justify-between">
        <dt className="text-zinc-600">Sales tax ({taxRatePercent}%)</dt>
        <dd className="tabular-nums text-zinc-900">{formatMoney(taxAmount)}</dd>
      </div>

      <div className="mt-1 flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold text-zinc-900">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatMoney(total)}</dd>
      </div>
    </dl>
  );
}
