import PriceSummary from "@/components/orders/PriceSummary";
import { Cart } from "@/lib/types";

/** The live cart's totals. Only an Applied discount is shown as a saving. */
export default function CartSummary({ cart }: { cart: Cart }) {
  const applied = cart.discount?.status === "Applied";
  return (
    <PriceSummary
      itemCount={cart.itemCount}
      subtotal={cart.subtotal}
      discountCode={applied ? cart.discount!.code : null}
      discountAmount={applied ? cart.discountAmount : 0}
      taxRatePercent={cart.taxRatePercent}
      taxAmount={cart.taxAmount}
      total={cart.total}
    />
  );
}
